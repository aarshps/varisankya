import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState, useCallback } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [mobile, setMobile] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSubscription, setNewSubscription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if session has valid database access
  useEffect(() => {
    if (session && session.dbAccessValid === false) {
      // If DB access is invalid, sign out the user
      signOut({ callbackUrl: '/' });
    }
  }, [session]);

  const fetchSubscriptions = useCallback(async () => {
    if (!session) return;

    // Check database access validity from session
    if (session.dbAccessValid === false) {
      signOut({ callbackUrl: '/' });
      return;
    }

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
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
    }
  }, [session, fetchSubscriptions]);

  const handleAddSubscription = async (e) => {
    e.preventDefault();

    if (!newSubscription.trim()) return;

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSubscription.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          signOut({ callbackUrl: '/' });
          return;
        }
        throw new Error('Failed to add subscription');
      }

      const newSub = await response.json();
      setSubscriptions([...subscriptions, newSub]);
      setNewSubscription('');
    } catch (err) {
      setError(err.message);
      console.error('Error adding subscription:', err);
    }
  };

  const handleDeleteSubscription = async (id) => {
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

      setSubscriptions(subscriptions.filter(sub => sub._id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting subscription:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Varisankya - Subscription Tracker</title>
          <meta name="description" content="Track and manage your subscriptions" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>
            Varisankya
          </h1>
          <p className={styles.description}>
            Track and manage your subscriptions
          </p>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p>Please sign in to view and manage your subscriptions</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              style={{
                padding: '12px 20px',
                fontSize: mobile ? '16px' : '18px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                marginTop: '1rem'
              }}
            >
              Sign in with Google
            </button>
          </div>
        </main>
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

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome {session.user?.name || 'User'}!
        </h1>
        <p className={styles.description}>
          Manage your subscriptions
        </p>

        <div style={{ width: '100%', maxWidth: mobile ? '100%' : '600px', padding: '20px' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <p>Signed in as {session.user?.email}</p>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                padding: '10px 15px',
                fontSize: '16px',
                backgroundColor: '#ea4335',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Add Subscription Form */}
          <form onSubmit={handleAddSubscription} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <input
                type="text"
                value={newSubscription}
                onChange={(e) => setNewSubscription(e.target.value)}
                placeholder="Add a subscription..."
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: mobile ? '16px' : '18px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  minWidth: 0
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  fontSize: mobile ? '16px' : '18px',
                  backgroundColor: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Add
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div style={{
              color: '#d93025',
              backgroundColor: '#fce8e6',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Loading subscriptions...
            </div>
          )}

          {/* Subscriptions List */}
          {!loading && (
            <div>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                Your Subscriptions ({subscriptions.length})
              </h2>

              {subscriptions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>
                  No subscriptions yet. Add one above!
                </p>
              ) : (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  width: '100%'
                }}>
                  {subscriptions.map((subscription) => (
                    <li
                      key={subscription._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        margin: '8px 0',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                    >
                      <span style={{
                        flex: 1,
                        wordBreak: 'break-word',
                        paddingRight: '10px'
                      }}>
                        {subscription.name}
                      </span>
                      <button
                        onClick={() => handleDeleteSubscription(subscription._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ea4335',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}