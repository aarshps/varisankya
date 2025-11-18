import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import { validateUserDatabase } from "../../../lib/dbValidation";

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
        token.username = user.email.split('@')[0];
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
      if (token && token.username) {
        const dbValid = await validateUserDatabase(token.username);

        if (!dbValid) {
          // If database is not valid, we'll mark this in the session
          // but let the app handle the sign out properly
          session.dbAccessValid = false;
        } else {
          session.dbAccessValid = true;
        }
      } else {
        // If we don't have the username in the token, we can't validate the database
        session.dbAccessValid = false;
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