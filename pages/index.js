import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import Subscriptions from '../components/Subscriptions';
import Header from '../components/Header';
import Loader from '../components/Loader';

export default function Home() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const hasFetched = useRef(false);

  // Check for error in URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setUrlError(error);
    }
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

  // Subscription handlers
  const handleAddSubscription = async () => {
    // Optimistic UI: Create a temporary blank subscription
    const tempId = 'temp-' + Date.now();
    const newSub = {
      _id: tempId,
      name: '', // Blank name
      cost: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: new Date().toISOString(),
      nextDueDate: null,
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
        body: JSON.stringify({ name: 'New Subscription' }), // Default name for DB, user will edit
      });

      if (!res.ok) throw new Error('Failed to add subscription');

      const createdSub = await res.json();
      console.log('[Frontend] Added subscription:', createdSub);

      // Replace temp item with actual item from DB
      setSubscriptions(prev => prev.map(sub =>
        sub._id === tempId ? { ...createdSub, isNew: true } : sub
      ));

      // We don't show a notification here to keep it seamless, or maybe a subtle one
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

  const handleDeleteSubscription = async (id) => {
    // Optimistic delete
    const subToDelete = subscriptions.find(sub => sub._id === id);
    setSubscriptions(subscriptions.filter(sub => sub._id !== id));

    try {
      const res = await fetch(`/api/subscriptions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subscription');

      setNotification({ type: 'success', message: 'Subscription deleted' });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setNotification({ type: 'error', message: 'Failed to delete subscription' });
      // Revert delete
      if (subToDelete) {
        setSubscriptions(prev => [...prev, subToDelete]);
      }
    }
  };

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
        <div className={styles.content}>
          <Subscriptions
            subscriptions={subscriptions}
            loading={loading}
            error={null}
            onDelete={handleDeleteSubscription}
            onUpdate={handleUpdateSubscription}
          />
        </div>
      </div>
    );
  };

  // Scroll detection for FAB
  const [isFabVisible, setIsFabVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setIsFabVisible(false); // Hide on scroll down
      } else {
        setIsFabVisible(true); // Show on scroll up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

      <Header
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

      {/* Floating Action Button for Add */}
      {status === 'authenticated' && (
        <button
          className={`${styles.fab} ${!isFabVisible ? styles.hidden : ''}`}
          onClick={handleAddSubscription}
        >
          Add
        </button>
      )}
    </div>
  );
}