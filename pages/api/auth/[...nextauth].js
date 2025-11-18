import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import { getUserDb } from "../../../lib/mongodb";

export default NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      // Include user email in token for database access
      if (user) {
        token.email = user.email;
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

      // Verify user database exists and is accessible during session creation
      if (token && token.email) {
        try {
          const email = token.email;
          const username = email.split('@')[0];

          // Get user-specific database
          const db = await getUserDb(username);

          // Test database access by attempting to access the subscriptions collection
          // This will create the database if it doesn't exist or throw an error if there's an issue
          await db.collection('subscriptions').findOne({});

          // Add a flag to indicate DB access is valid
          session.dbAccessValid = true;
        } catch (error) {
          console.error(`Database access error for user ${token.email}:`, error);
          // Return null to end the session if database is not accessible
          return null;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});