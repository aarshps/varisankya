import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export const useDatabaseValidation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in but database access is not valid
    if (status === 'authenticated' && session && session.dbAccessValid === false) {
      // Redirect to sign-in page with an error message
      router.push('/auth/signin?error=db_not_found');
    }
  }, [status, session, router]);

  return { session, status };
};