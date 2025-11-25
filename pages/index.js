import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import HeaderComponent from '../components/HeaderComponent';
import PageContentComponent from '../components/PageContentComponent';
import SubscriptionList from '../components/SubscriptionList';
import FloatingButtonComponent from '../components/FloatingButtonComponent';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import SubscriptionForm from '../components/SubscriptionForm';
import SummaryModal from '../components/SummaryModal';
import useHaptics, { markHapticsInitialized } from '../lib/useHaptics';

export default function Home() {
  const { triggerHaptic } = useHaptics();
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const hasFetched = useRef(false);

  // Add Subscription Modal State
  const [isAddingSubscription, setIsAddingSubscription] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);

  // Summary Modal State - Show on page load
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Undo State
  const [undoItem, setUndoItem] = useState(null);
  const [undoType, setUndoType] = useState(null); // 'delete' or 'stop'
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef(null);
  const notificationTimerRef = useRef(null);

  // Check for error in URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setUrlError(error);
    }
  }, []);

  // Initialize haptics on first user interaction
  // NOTE: Vibration API ONLY works with trusted user gestures (click, touch)
  // Scroll is NOT a valid gesture for initializing vibration API
  useEffect(() => {
    let initialized = false;

    const initializeHaptics = (event) => {
      if (!initialized) {
        initialized = true;
        console.log('🎯 Haptics initialization triggered by:', event.type);

        // Test if vibration API actually works by calling it directly
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            // Try to vibrate - this is the actual test
            const result = navigator.vibrate(30);
            console.log('Vibrate call result:', result);
            if (result) {
              // Only mark as initialized if vibrate succeeded
              markHapticsInitialized();
              console.log('✅ Haptics initialized successfully - scroll haptics now enabled');
            } else {
              console.warn('⚠️ Vibrate returned false - API not ready');
            }
          } catch (e) {
            console.error('❌ Haptics initialization failed:', e);
          }
        } else {
          console.warn('⚠️ Navigator.vibrate not available');
        }

        // Remove listeners after first trigger attempt
        window.removeEventListener('click', initializeHaptics, true);
        window.removeEventListener('touchstart', initializeHaptics, true);
      }
    };

    // Listen for first real user interaction
    // ONLY click and touchstart - scroll cannot initialize vibration API
    window.addEventListener('click', initializeHaptics, true);
    window.addEventListener('touchstart', initializeHaptics, true);

    return () => {
      window.removeEventListener('click', initializeHaptics, true);
      window.removeEventListener('touchstart', initializeHaptics, true);
    };
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      console.log('[Frontend] Fetching subscriptions...');
      const res = await fetch('/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const data = await res.json();
      console.log('[Frontend] Fetched subscriptions:', data);
      setSubscriptions(data);
      hasFetched.current = true;
    } catch (error) {
      console.error('[Frontend] Error fetching subscriptions:', error);
      setNotification({ type: 'error', message: 'Failed to load subscriptions' });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      fetchSubscriptions();
    }
  }, [status, fetchSubscriptions]);

  // Show summary modal after subscriptions are loaded
  useEffect(() => {
    if (!loading && hasFetched.current && status === 'authenticated') {
      // Show modal after a slight delay to let the UI settle
      const timer = setTimeout(() => {
        setShowSummaryModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, status]);

  // Haptic feedback when loading finishes
  useEffect(() => {
    if (!loading && hasFetched.current) {
      triggerHaptic('light');
    }
  }, [loading, triggerHaptic]);

  // Handler for closing summary modal and initializing haptics
  const handleCloseSummaryModal = () => {
    // Initialize haptics on this click - guaranteed user gesture
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(30);
        markHapticsInitialized();
        console.log('✅ Haptics initialized via summary modal click');
      } catch (e) {
        console.error('Failed to initialize haptics:', e);
      }
    }
    setShowSummaryModal(false);
  };

  // Subscription handlers
  const handleAddSubscription = () => {
    setIsAddingSubscription(true);
  };

  const handleSaveNewSubscription = async ({ name, date, cost, currency, billingCycle, customDays, category, notes }) => {
    setIsAddingSubscription(false);

    // Optimistic UI: Create a temporary blank subscription
    const tempId = 'temp-' + Date.now();
    const newSub = {
      _id: tempId,
      localId: tempId, // Stable ID for React key
      name: name,
      cost: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: new Date().toISOString(),
      nextDueDate: date || null,
      cost,
      currency,
      billingCycle,
      customDays,
      category,
      notes,
      active: true,
      isNew: true // Flag to indicate this is a new item to auto-expand
    };

    // Add to top of list immediately
    setSubscriptions([newSub, ...subscriptions]);

    try {
      console.log('[Frontend] Adding subscription...');
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nextDueDate: date, cost, currency, billingCycle, customDays, category, notes }),
      });

      if (!res.ok) throw new Error('Failed to add subscription');

      const createdSub = await res.json();
      console.log('[Frontend] Added subscription:', createdSub);

      // Replace temp item with actual item from DB, but keep localId
      setSubscriptions(prev => prev.map(sub =>
        sub._id === tempId ? { ...createdSub, localId: tempId, isNew: true } : sub
      ));

      setNotification({ type: 'success', message: 'Subscription added successfully' });
    } catch (error) {
      console.error('[Frontend] Error adding subscription:', error);
      setNotification({ type: 'error', message: 'Failed to add subscription' });
      // Remove temp item on error
      setSubscriptions(prev => prev.filter(sub => sub._id !== tempId));
    }
  };

  const handleUpdateSubscription = async (updatedSub) => {
    // Check for Stop action (active changing from true/undefined to false)
    const originalSub = subscriptions.find(s => s._id === updatedSub._id);
    const isStopAction = originalSub && (originalSub.active !== false) && (updatedSub.active === false);

    // Optimistic update
    setSubscriptions(subscriptions.map(sub =>
      sub._id === updatedSub._id ? updatedSub : sub
    ));

    if (isStopAction) {
      setUndoItem(originalSub);
      setUndoType('stop');
      setShowUndo(true);

      // Clear previous timers
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (notificationTimerRef.current) clearInterval(notificationTimerRef.current);

      let countdown = 5;
      setNotification({ type: 'neutral', message: `Subscription stopped. Undo? (${countdown}s)` });

      notificationTimerRef.current = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
          setNotification({ type: 'neutral', message: `Subscription stopped. Undo? (${countdown}s)` });
        } else {
          clearInterval(notificationTimerRef.current);
          setShowUndo(false);
          setUndoItem(null);
          setUndoType(null);
          setNotification({ type: 'success', message: 'Subscription stopped successfully' });
          undoTimerRef.current = setTimeout(() => setNotification(null), 3000);
        }
      }, 1000);
    }

    try {
      console.log('[Frontend] Updating subscription:', updatedSub);
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSub),
      });

      if (!res.ok) throw new Error('Failed to update subscription');

      const result = await res.json();
      console.log('[Frontend] Updated subscription result:', result);
      if (!isStopAction) {
        setNotification({ type: 'success', message: 'Subscription updated successfully' });
      }

    } catch (error) {
      console.error('[Frontend] Error updating subscription:', error);
      setNotification({ type: 'error', message: 'Failed to update subscription' });
      fetchSubscriptions(); // Refresh to ensure consistency
    }
  };

  const handleDeleteSubscription = async (id) => {
    // Store item for undo
    const subToDelete = subscriptions.find(sub => sub._id === id);
    if (subToDelete) {
      setUndoItem(subToDelete);
      setUndoType('delete');
      setShowUndo(true);

      // Clear previous timers
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (notificationTimerRef.current) clearInterval(notificationTimerRef.current);

      let countdown = 5;
      setNotification({ type: 'neutral', message: `Subscription deleted. Undo? (${countdown}s)` });

      // Start countdown for notification
      notificationTimerRef.current = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
          setNotification({ type: 'neutral', message: `Subscription deleted. Undo? (${countdown}s)` });
        } else {
          // Time's up
          clearInterval(notificationTimerRef.current);
          setShowUndo(false);
          setUndoItem(null);
          setUndoType(null);
          setNotification({ type: 'success', message: 'Subscription deleted successfully' });
          // Clear success message after 3 seconds
          undoTimerRef.current = setTimeout(() => setNotification(null), 3000);
        }
      }, 1000);
    }

    // Optimistic delete
    setSubscriptions(subscriptions.filter(sub => sub._id !== id));

    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subscription');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setNotification({ type: 'error', message: 'Failed to delete subscription' });
      // Revert delete
      if (subToDelete) {
        setSubscriptions(prev => [...prev, subToDelete]);
      }
      // Clear timers if failed
      if (notificationTimerRef.current) clearInterval(notificationTimerRef.current);
      setShowUndo(false);
    }
  };

  const handleUndo = async () => {
    if (!undoItem) return;

    // Clear timers immediately
    if (notificationTimerRef.current) clearInterval(notificationTimerRef.current);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    if (undoType === 'delete') {
      // Restore item (Create)
      const stableId = undoItem.localId || undoItem._id;
      setSubscriptions(prev => [{ ...undoItem, localId: stableId, isNew: true }, ...prev]);
      setShowUndo(false);

      try {
        const { _id, ...dataToRestore } = undoItem;

        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToRestore),
        });

        if (!res.ok) throw new Error('Failed to restore subscription');
        const restoredSub = await res.json();

        // Update the restored item with the new ID from server
        setSubscriptions(prev => prev.map(sub =>
          sub._id === undoItem._id ? { ...restoredSub, localId: stableId, isNew: true } : sub
        ));

        setNotification({ type: 'success', message: 'Subscription restored' });
      } catch (error) {
        console.error('Error restoring subscription:', error);
        setNotification({ type: 'error', message: 'Failed to restore subscription' });
        setSubscriptions(prev => prev.filter(sub => sub._id !== undoItem._id));
      }
    } else if (undoType === 'stop') {
      // Restore item (Update active: true)
      const restoredSub = { ...undoItem, active: true };
      setSubscriptions(prev => prev.map(sub => sub._id === undoItem._id ? restoredSub : sub));
      setShowUndo(false);

      try {
        const res = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(restoredSub),
        });

        if (!res.ok) throw new Error('Failed to restore subscription state');
        setNotification({ type: 'success', message: 'Subscription resumed' });
      } catch (error) {
        console.error('Error restoring subscription state:', error);
        setNotification({ type: 'error', message: 'Failed to resume subscription' });
        // Revert
        setSubscriptions(prev => prev.map(sub => sub._id === undoItem._id ? undoItem : sub));
      }
    }

    setUndoItem(null);
    setUndoType(null);
  };

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      if (notification.type === 'success') triggerHaptic('success');
      if (notification.type === 'error') triggerHaptic('error');
      if (notification.type === 'neutral') triggerHaptic('warning');

      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, triggerHaptic]);

  // Handle sign in
  const handleSignIn = () => {
    setIsSigningIn(true);
    signIn('google', { callbackUrl: '/' });
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Determine if we have a database-related error
  const hasDbError = urlError === 'db_not_found';

  // Render different content based on authentication status
  const renderContent = () => {
    if (status === 'unauthenticated') {
      return (
        <main className={`${styles.appMain} ${styles.centeredMain}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column', paddingBottom: '10vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '20px' }}>
            {hasDbError && (
              <div style={{
                color: '#d93025',
                backgroundColor: '#fce8e6',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Your database was not found. Please contact support or try signing in again.
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 24px',
                  height: '48px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  color: '#3c4043',
                  border: '1px solid #dadce0',
                  borderRadius: '24px',
                  cursor: isSigningIn ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  width: 'auto',
                  minWidth: '240px',
                  margin: '0 auto',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'background-color 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => !isSigningIn && (e.currentTarget.style.backgroundColor = '#f8f9fa', e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)')}
                onMouseOut={(e) => !isSigningIn && (e.currentTarget.style.backgroundColor = '#ffffff', e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '20px', height: '20px', marginRight: '12px' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>
        </main>
      );
    }

    if (status === 'loading' || (status === 'authenticated' && loading && !hasFetched.current)) {
      return (
        <main className={styles.appMain} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Loader size={48} />
        </main>
      );
    }

    return (
      <div className={styles.appMain}>
        <PageContentComponent>
          {loading && !hasFetched.current ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Loader />
            </div>
          ) : (
            <SubscriptionList
              subscriptions={subscriptions}
              onDelete={handleDeleteSubscription}
              onUpdate={handleUpdateSubscription}
              onMarkPaidModalOpen={() => setIsMarkPaidModalOpen(true)}
              onMarkPaidModalClose={() => setIsMarkPaidModalOpen(false)}
            />
          )}
        </PageContentComponent>
      </div>
    );
  };

  return (
    <div className={status === 'unauthenticated' ? styles.appContainer : styles.container}>
      <Head>
        <title>{status === 'unauthenticated' ? 'Varisankya - Sign In' : 'Varisankya'}</title>
        <meta name="description" content={status === 'unauthenticated' ? "Sign in to Varisankya subscription tracker" : "Track your subscriptions"} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#121212" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-logo.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <HeaderComponent
        session={session}
        onSignOut={handleSignOut}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notification} ${styles[`notification--${notification.type}`]}`}>
          {notification.message}
        </div>
      )}

      {/* Render content based on current state */}
      {renderContent()}

      {/* Summary Modal - Shows on page load */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={handleCloseSummaryModal}
        subscriptions={subscriptions}
      />

      {/* Add Subscription Modal */}
      <Modal
        isOpen={isAddingSubscription}
        onClose={() => setIsAddingSubscription(false)}
        title="Add Subscription"
      >
        <SubscriptionForm
          onSubmit={handleSaveNewSubscription}
          onCancel={() => setIsAddingSubscription(false)}
          showDelete={false}
        />
      </Modal>

      {/* Floating Action Button for Add */}
      {status === 'authenticated' && !isMarkPaidModalOpen && (
        <FloatingButtonComponent
          onClick={handleAddSubscription}
          showUndo={showUndo}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}