import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <title>Hello World App</title>
          <meta name="description" content="A simple mobile-first Next.js application" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>
            Hello World!
          </h1>
          <p className={styles.description}>
            Welcome to your mobile-first Next.js application
          </p>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p>Please sign in to view this content</p>
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

  // User is authenticated, show the main content
  return (
    <div className={styles.container}>
      <Head>
        <title>Hello World App</title>
        <meta name="description" content="A simple mobile-first Next.js application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://varisankya.vercel.app/" />
        <meta property="og:title" content="Hello World App" />
        <meta property="og:description" content="A simple mobile-first Next.js application" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://varisankya.vercel.app/" />
        <meta property="twitter:title" content="Hello World App" />
        <meta property="twitter:description" content="A simple mobile-first Next.js application" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hello {session.user?.name || 'World'}!
        </h1>
        <p className={styles.description}>
          Welcome to your mobile-first Next.js application
        </p>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
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
      </main>
    </div>
  );
}