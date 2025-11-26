import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { validateUserDatabase } from "../../../lib/dbValidation";
import { getUserDatabase } from "../../../lib/databaseFactory";
import config from '../../../lib/config';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
    }),
  ],
  secret: config.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      // Include user email in token for database access
      if (user) {
        token.email = user.email;
        token.username = user.email.split('@')[0];
        token.name = user.name || token.email.split('@')[0];
        token.picture = user.image || null;
      }

      // Only during sign-in (when `account` is present) should we attempt to create a user DB.
      if (account && token.username) {
        try {
          const dbValid = await validateUserDatabase(token.username);
          if (!dbValid) {
            const db = await getUserDatabase(token.username);
            const usersCollection = db.collection('users');
            await usersCollection.updateOne(
              { email: token.email },
              {
                $set: {
                  name: token.name || token.email.split('@')[0],
                  image: token.picture || null,
                  lastLogin: new Date(),
                  username: token.username,
                },
                $setOnInsert: {
                  createdAt: new Date(),
                },
              },
              { upsert: true }
            );
            token.dbAccessValid = true;
          } else {
            token.dbAccessValid = true;
          }
        } catch (error) {
          console.error(`[NextAuth] Error creating database for user: ${token.username}`, error);
          token.dbAccessValid = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider
      // Safely handle the case where token might be undefined
      if (token && token.accessToken) {
        session.accessToken = token.accessToken;
      }

      // Add user email to session for database access
      if (token && token.email) {
        session.user.email = token.email;
      }

      // Include username in the session for database access
      if (token && token.username) {
        session.user.username = token.username;
        // Add database name to session for UI display
        session.user.databaseName = config.getDatabaseName(token.username);
      }

      // Always perform a non-creating validation on session creation/refresh
      if (token && token.username) {
        try {
          const dbValid = await validateUserDatabase(token.username);
          if (!dbValid) {
            // Invalidate the session to ensure client is logged out
            return null;
          }
          session.dbAccessValid = true;
        } catch (error) {
          console.error(`[NextAuth] Error validating database for user: ${token.username}`, error);
          // Invalidate session on error to be safe
          return null;
        }
      } else {
        // No username, invalidate session
        return null;
      }

      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
  debug: config.isDevelopment(),
};

const handler = (req, res) => {
  const isAndroidApp = req.headers['user-agent']?.includes('VarisankyaApp');

  const finalAuthOptions = {
    ...authOptions,
    cookies: isAndroidApp ? {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'none',
          path: '/',
          secure: true
        }
      }
    } : {}
  };

  return NextAuth(req, res, finalAuthOptions);
};

export default handler;