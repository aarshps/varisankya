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
import useHaptics from '../lib/useHaptics';

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

  // Undo Delete State
  const [deletedItem, setDeletedItem] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef(null);

  // Check for error in URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setUrlError(error);
    }

    // Fake click workaround to prime haptics
    const fakeClick = () => {
      if (typeof document !== 'undefined') {
        const btn = document.createElement('button');
        btn.style.position = 'absolute';
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        document.body.appendChild(btn);
        btn.click();
        document.body.removeChild(btn);

        // Also try to trigger a tiny vibration if allowed
        if (navigator.vibrate) {
          try { navigator.vibrate(1); } catch (e) { }
        }
      }
    };

    // Try immediately and after a small delay
    fakeClick();
    setTimeout(fakeClick, 500);

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

  // Haptic feedback when loading finishes and on initial page load
  useEffect(() => {
    if (!loading && hasFetched.current) {
      triggerHaptic('light');
    }
  }, [loading, triggerHaptic]);

  // Initial haptic on page load to prime the haptics system
  useEffect(() => {
    if (status === 'authenticated') {
      // Trigger initial haptic after a short delay to ensure page is ready
      const timer = setTimeout(() => {
        triggerHaptic('ultra-light');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, triggerHaptic]);

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
    // Optimistic update
    setSubscriptions(subscriptions.map(sub =>
      sub._id === updatedSub._id ? updatedSub : sub
    ));

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
      setNotification({ type: 'success', message: 'Subscription updated successfully' });

      // No need to update state again if successful as we did optimistic update
      // But we might want to sync back any server-side changes if needed
    } catch (error) {
      console.error('[Frontend] Error updating subscription:', error);
      setNotification({ type: 'error', message: 'Failed to update subscription' });
      // Revert changes? For now we just notify error.
      // Ideally we would revert to previous state but that requires tracking it.
      fetchSubscriptions(); // Refresh to ensure consistency
    }
  };

  const notificationTimerRef = useRef(null);

  const handleDeleteSubscription = async (id) => {
    // Store item for undo
    const subToDelete = subscriptions.find(sub => sub._id === id);
    if (subToDelete) {
      setDeletedItem(subToDelete);
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
          setDeletedItem(null);
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

  const handleUndoDelete = async () => {
    if (!deletedItem) return;

    // Clear timers immediately
    if (notificationTimerRef.current) clearInterval(notificationTimerRef.current);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Restore item
    const stableId = deletedItem.localId || deletedItem._id;
    setSubscriptions(prev => [{ ...deletedItem, localId: stableId, isNew: true }, ...prev]);
    setShowUndo(false);

    // Re-create on server
    try {
      const { _id, ...dataToRestore } = deletedItem;

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToRestore),
      });

      if (!res.ok) throw new Error('Failed to restore subscription');
      const restoredSub = await res.json();

      // Update the restored item with the new ID from server
      const stableId = deletedItem.localId || deletedItem._id;
      setSubscriptions(prev => prev.map(sub =>
        sub._id === deletedItem._id ? { ...restoredSub, localId: stableId, isNew: true } : sub
      ));

      setNotification({ type: 'success', message: 'Subscription restored' });
    } catch (error) {
      console.error('Error restoring subscription:', error);
      setNotification({ type: 'error', message: 'Failed to restore subscription' });
      setSubscriptions(prev => prev.filter(sub => sub._id !== deletedItem._id));
    }
    setDeletedItem(null);
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
          onUndo={handleUndoDelete}
        />
      )}
    </div>
  );
}