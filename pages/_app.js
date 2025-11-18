import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';

// Component to handle database validation
function DatabaseValidationHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session && session.dbAccessValid === false) {
      // Redirect to sign-in page with an error message
      router.push('/auth/signin?error=db_not_found');
    }
  }, [status, session, router]);

  return null; // This component doesn't render anything
}

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <DatabaseValidationHandler />
      <Component {...pageProps} />
    </SessionProvider>
  );
}