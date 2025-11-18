import { getServerSession } from 'next-auth';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import styles from '../../styles/Home.module.css';

export default function SignIn({}) {
  const [mobile, setMobile] = useState(false);
  const router = useRouter();
  const { error } = router.query;
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

  // Determine if we have a database-related error
  const hasDbError = error === 'db_not_found';

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      setIsSigningIn(false);
    }
  };

  // For the sign-in page, we want a simple header with just the app name
  // We'll pass null refs since we don't need hamburger functionality
  const nullRef = { current: null };

  return (
    <div className={styles.appContainer}>
      <Head>
        <title>Varisankya - Sign In</title>
        <meta name="description" content="Sign in to Varisankya subscription tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header
        session={null}
        onHamburgerClick={() => {}}
        hamburgerRef={nullRef}
        hideHamburger={true}
      />

      <main className={`${styles.appMain} ${styles.centeredMain}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '20px' }}>
          <h1 className={styles.title}>
            Varisankya
          </h1>
          <p className={styles.description}>
            Track and manage your subscriptions
          </p>

          {/* Error message for database not found */}
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
                padding: '12px 20px',
                fontSize: mobile ? '16px' : '18px',
                backgroundColor: isSigningIn ? '#cccccc' : '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSigningIn ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                width: '100%'
              }}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// This is the server-side function to get the providers
export async function getServerSideProps(context) {
  // We don't need providers since we're only using Google
  return {
    props: {},
  };
}