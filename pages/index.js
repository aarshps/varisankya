import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import App from '../components/App';
import Subscriptions from '../components/Subscriptions';
import Header from '../components/Header';

export default function Home() {
  const { data: session, status } = useSession();
  const [mobile, setMobile] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSubscription, setNewSubscription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasFetched = useRef(false);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const router = useRouter();
  const { error: urlError } = router.query;
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if session has valid database access on page load and only once (no auto-refresh on window focus)
  useEffect(() => {
    if (session) {
      if (session.dbAccessValid === false) {
        // If DB access was already invalid, sign out the user
        console.log('[Page Refresh] Session indicates invalid database access, signing out');
        signOut({ callbackUrl: '/' });
      } else if (session.user?.username) {
        // Validate database access using lightweight endpoint to avoid fetching subscriptions
        const validateDbAccess = async () => {
          try {
            console.log(`[Page Refresh] Validating database access for user: ${session.user.username}`);

            // Use a lightweight endpoint that only validates DB existence
            const response = await fetch('/api/db/validate');

            if (response.status === 401) {
              console.log('[Page Refresh] Database access failed (401), signing out user');
              signOut({ callbackUrl: '/' });
            } else if (!response.ok) {
              console.log(`[Page Refresh] Database validation failed with status: ${response.status}, signing out user`);
              signOut({ callbackUrl: '/' });
            } else {
              console.log('[Page Refresh] Database access validated successfully');
            }
          } catch (error) {
            console.error('[Page Refresh] Database validation network error:', error);
            signOut({ callbackUrl: '/' });
          }
        };

        // Only validate once when session arrives, to avoid repeated DB calls on focus
        validateDbAccess();
      }
    }
  }, [session]);

  const fetchSubscriptions = useCallback(async (force = false) => {
    if (!session) return;
    // Check database access validity from session
    if (session.dbAccessValid === false) {
      signOut({ callbackUrl: '/' });
      return;
    }

    if (hasFetched.current && !force) return;

    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions');
      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or invalid, redirect to sign out
          signOut({ callbackUrl: '/' });
          return;
        }
        throw new Error('Failed to fetch subscriptions');
      }
      const data = await response.json();
      setSubscriptions(data);
      hasFetched.current = true;
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
    }
    // Intentionally omit session here to avoid re-fetching on focus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSubscriptions]);

  const handleAddSubscription = async (e) => {
    e.preventDefault();

    if (!newSubscription.trim()) return;

    // Optimistic update: add the subscription to the UI immediately
    const tempId = Date.now().toString(); // Temporary ID for optimistic update
    const optimisticSubscription = {
      _id: tempId,
      localId: tempId, // Stable ID for UI rendering to prevent re-animation
      name: newSubscription.trim(),
      createdAt: new Date().toISOString()
    };

    setSubscriptions(prev => [...prev, optimisticSubscription]);
    setNewSubscription('');

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: optimisticSubscription.name }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          signOut({ callbackUrl: '/' });
          return;
        }
        throw new Error('Failed to add subscription');
      }

      const actualSub = await response.json();

      // Update the subscription with the actual ID from the server but keep localId
      setSubscriptions(prev =>
        prev.map(sub =>
          sub._id === tempId ? { ...actualSub, localId: tempId } : sub
        )
      );

      // Show success notification
      setNotification({ type: 'success', message: 'Subscription added successfully!' });
    } catch (err) {
      // If there's an error, remove the optimistic subscription
      setSubscriptions(prev => prev.filter(sub => sub._id !== tempId));
      setNotification({ type: 'error', message: err.message });
      console.error('Error adding subscription:', err);
    }
  };

  const handleUpdateSubscription = async (updatedSub) => {
    // Optimistic update
    setSubscriptions(prev => prev.map(sub => sub._id === updatedSub._id ? updatedSub : sub));

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updatedSub._id, ...updatedSub }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          signOut({ callbackUrl: '/' });
          return;
        }
        throw new Error('Failed to update subscription');
      }

      setNotification({ type: 'success', message: 'Subscription updated!' });
    } catch (err) {
      console.error('Error updating subscription:', err);
      setNotification({ type: 'error', message: err.message });
      fetchSubscriptions(true); // Revert on error
    }
  };

  const handleDeleteSubscription = async (id) => {
    // Optimistic update: remove the subscription from UI immediately
    setSubscriptions(prev => prev.filter(sub => sub._id !== id));

    try {
      const response = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          signOut({ callbackUrl: '/' });
          return;
        }
        throw new Error('Failed to delete subscription');
      }

      // Show success notification
      setNotification({ type: 'success', message: 'Subscription deleted successfully!' });
    } catch (err) {
      // If there's an error, re-add the subscription to the UI
      setNotification({ type: 'error', message: err.message });
      console.error('Error deleting subscription:', err);
      // Fetch subscriptions again to restore the list
      fetchSubscriptions(true); // force refresh
    }
  };





  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, sidebarRef, hamburgerRef]);

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
    // Direct redirect to Google OAuth flow
    signIn('google', { callbackUrl: '/' });
  };

  // Determine if we have a database-related error
  const hasDbError = urlError === 'db_not_found';

  if (status === 'unauthenticated') {
    // Show login page for unauthenticated users
    return (
      <div className={styles.appContainer}>
        <Head>
          <title>Varisankya - Sign In</title>
          <meta name="description" content="Sign in to Varisankya subscription tracker" />
          <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </Head>

        <Header
          session={null}
          onHamburgerClick={() => { }}
          hamburgerRef={{ current: null }}
          hideHamburger={true}
        />

        <main className={`${styles.appMain} ${styles.centeredMain}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column', paddingBottom: '10vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '20px' }}>

            {/* Error message for database not found - shown inline on login page since notifications are for app errors */}
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
                  width: 'auto', // Not full width
                  minWidth: '240px',
                  margin: '0 auto',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'background-color 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => !isSigningIn && (e.currentTarget.style.backgroundColor = '#f8f9fa', e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)')}
                onMouseOut={(e) => !isSigningIn && (e.currentTarget.style.backgroundColor = '#ffffff', e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
              >
                {/* Google G Logo SVG */}
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
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className={styles.main}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main content with subscription management
  return (
    <div className={styles.container}>
      <Head>
        <title>Varisankya - Subscription Tracker</title>
        <meta name="description" content="Track and manage your subscriptions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notification} ${styles[`notification--${notification.type}`]}`}>
          {notification.message}
        </div>
      )}

      <App
        session={session}
        sidebarOpen={sidebarOpen}
        sidebarRef={sidebarRef}
        hamburgerRef={hamburgerRef}
        onHamburgerClick={() => setSidebarOpen(!sidebarOpen)}
        onCloseSidebar={() => setSidebarOpen(false)}
        onSignOut={async () => {
          // Optimistic UI: immediately close sidebar and start logout process
          setSidebarOpen(false);
          await signOut({ callbackUrl: '/' });
        }}
        composerProps={{ value: newSubscription, onChange: (v) => setNewSubscription(v), onSubmit: handleAddSubscription }}
      >
        <div className={styles.content}>
          <Subscriptions
            subscriptions={subscriptions}
            loading={loading}
            error={null} // Using notifications instead of inline error
            onDelete={handleDeleteSubscription}
            onUpdate={handleUpdateSubscription}
            composerProps={{ value: newSubscription, onChange: (v) => setNewSubscription(v), onSubmit: handleAddSubscription }}
          />
        </div>

        {/* Composer handled by Page component */}
      </App>
    </div>
  );
}