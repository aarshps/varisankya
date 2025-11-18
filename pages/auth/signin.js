import { getServerSession } from 'next-auth';
import { getProviders, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../../styles/Home.module.css';

export default function SignIn({ providers }) {
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

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - Hello World App</title>
        <meta name="description" content="Login to access the Hello World app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the App
        </h1>
        <p className={styles.description}>
          Please sign in to continue
        </p>

        <div className={styles.loginContainer} style={{ 
          width: '100%', 
          maxWidth: mobile ? '100%' : '400px',
          padding: '20px',
          textAlign: 'center'
        }}>
          {Object.values(providers).map((provider) => (
            <div key={provider.name} style={{ marginBottom: '1rem', width: '100%' }}>
              <button
                className={styles.googleButton}
                onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                style={{
                  padding: '12px 20px',
                  fontSize: mobile ? '16px' : '18px',
                  width: '100%',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Sign in with {provider.name}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// This is the server-side function to get the providers
export async function getServerSideProps(context) {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}