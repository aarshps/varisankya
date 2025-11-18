# Mobile-First Hello World Next.js App with Google Authentication

A simple, responsive Next.js application with a mobile-first approach that can be deployed on Vercel, featuring Google authentication.

## Features

- Mobile-first responsive design
- Google OAuth authentication using NextAuth.js
- Protected routes - content only accessible to authenticated users
- Optimized for performance
- SEO-friendly with proper meta tags
- Clean, minimal codebase
- Ready for Vercel deployment

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, set up your environment variables:

1. Create a `.env.local` file in the root directory with your Google OAuth credentials and MongoDB connection string:
   ```env
   CLIENT_ID="your_google_client_id_here"
   CLIENT_SECRET="your_google_client_secret_here"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000" # For production, use your production URL
   MONGODB_URI="your_mongodb_connection_string_here"
   ```
   (Use the `.env.example` file as a template)

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google OAuth Setup

To enable Google login:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project
4. Create OAuth 2.0 credentials (Web application)
5. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-vercel-deployment-url.vercel.app/api/auth/callback/google` (for production)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Deploy from Git

1. Push this repository to GitHub
2. Connect your GitHub account to Vercel
3. Import this repository into Vercel
4. Add your environment variables in the Vercel dashboard (CLIENT_ID, CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL, MONGODB_URI)
5. Vercel will automatically detect it's a Next.js app and build it
6. Your app will be deployed with a unique URL

## Project Structure

- `pages/index.js` - Main page component (protected, only accessible to authenticated users)
- `pages/_app.js` - Custom App component for global styles and session provider
- `pages/api/auth/[...nextauth].js` - NextAuth.js API route for handling authentication
- `pages/auth/signin.js` - Custom sign-in page
- `styles/` - CSS modules and global styles
- `public/` - Static assets like favicon
- `.env.example` - Example environment variables file

## Code Features

- Mobile-first CSS with responsive breakpoints
- Semantic HTML
- Accessibility considerations
- Secure authentication with NextAuth.js
- Optimized for SEO