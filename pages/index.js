import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import App from '../components/App';
import Subscriptions from '../components/Subscriptions';

export default function Home() {
  const { data: session, status } = useSession();
  const [mobile, setMobile] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSubscription, setNewSubscription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasFetched = useRef(false);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);

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

      // Update the subscription with the actual ID from the server
      setSubscriptions(prev =>
        prev.map(sub =>
          sub._id === tempId ? actualSub : sub
        )
      );
    } catch (err) {
      // If there's an error, remove the optimistic subscription
      setSubscriptions(prev => prev.filter(sub => sub._id !== tempId));
      setError(err.message);
      console.error('Error adding subscription:', err);
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
    } catch (err) {
      // If there's an error, re-add the subscription to the UI
      setError(err.message);
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

  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className={styles.container}>
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
      </Head>

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
            error={error}
            onDelete={handleDeleteSubscription}
            composerProps={{ value: newSubscription, onChange: (v) => setNewSubscription(v), onSubmit: handleAddSubscription }}
          />
        </div>

        {/* Composer handled by Page component */}
      </App>
    </div>
  );
}