# Mobile-First Subscription Tracker with Google Authentication

A mobile-first Next.js application that allows users to track their subscriptions with Google login and user-specific databases.

## Overview

This application implements:
- Google OAuth authentication using NextAuth.js
- User-specific MongoDB databases for subscription data (vari_<username>_<environment>)
- Protected routes - only authenticated users can access subscription data
- Mobile-responsive UI for subscription management
- Auto-logout when user's database becomes inaccessible

## Features

- Mobile-first responsive design
- Google OAuth authentication using NextAuth.js
- Protected routes - content only accessible to authenticated users
- User-specific database creation (vari_<username>_<environment>)
- Subscription CRUD operations (Create, Read, Delete)
- Auto-logout when database access fails
- Optimized for performance
- SEO-friendly with proper meta tags
- Clean, minimal codebase
- Ready for Vercel deployment

## Project Structure

```
varisankya/
├── lib/
│   └── mongodb.js           # MongoDB client with user-specific database support
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].js  # NextAuth configuration with database validation
│   │   └── subscriptions/
│   │       └── index.js          # Subscription CRUD API endpoints
│   ├── auth/
│   │   └── signin.js             # Custom sign-in page
│   ├── _app.js                   # Wraps app with SessionProvider
│   └── index.js                  # Main page with subscription management UI
├── public/
│   └── favicon.ico
├── styles/
│   └── Home.module.css           # Mobile-first styles
├── .env.example                  # Environment variable template
├── .env.local                    # Local environment variables (gitignored)
├── next.config.js                # Next.js configuration
├── package.json
└── README.md                     # This file
```

## Getting Started

### Prerequisites

1. Node.js (v14 or higher)
2. MongoDB database (e.g., MongoDB Atlas)

### Setup

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env.local` file in the root directory with:
```env
CLIENT_ID="your_google_client_id_here"
CLIENT_SECRET="your_google_client_secret_here"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000" # For production, use your production URL
MONGODB_URI="your_mongodb_connection_string_here"
```

Use the `.env.example` file as a template.

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Google OAuth Setup

To enable Google login:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project
4. Create OAuth 2.0 credentials (Web application)
5. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
   - `https://your-vercel-deployment-url.vercel.app/api/auth/callback/google` (for production)

## Database Architecture

The application creates user-specific databases with the naming convention:
- `vari_<username>_<environment>`
- Examples:
  - Development: `vari_aarshps_development`
  - Production: `vari_aarshps_production`

Each database contains a `subscriptions` collection that stores subscription documents with a `name` field.

### Database Validation

- The application validates database access during session creation
- If a user's database becomes inaccessible (e.g., deleted), the user is automatically logged out
- The NextAuth adapter uses a separate database for session management
- Each user's subscription data is stored in their own database with isolation

## API Endpoints

- `GET /api/subscriptions` - Retrieve user's subscriptions
- `POST /api/subscriptions` - Add a new subscription
- `DELETE /api/subscriptions?id=<id>` - Delete a subscription

All endpoints require authentication and validate database access.

## Key Implementation Details

### NextAuth Configuration
- Uses MongoDB adapter for general session storage
- Validates user database access during session creation
- Automatically invalidates session if database access fails
- Includes Google OAuth provider

### Database Client (`lib/mongodb.js`)
- Creates user-specific database instances based on username and environment
- Uses `client.db(dbName)` to specify database at runtime
- Handles both development and production environments

### Frontend Integration
- Uses `useSession` hook to check authentication status
- Validates database access flag in session
- Provides subscription management UI (add/remove)
- Responsive design optimized for mobile devices

## Deployment

### Vercel Deployment

1. Push this repository to GitHub
2. Connect your GitHub account to Vercel
3. Import this repository into Vercel
4. Add your environment variables in the Vercel dashboard:
   - CLIENT_ID
   - CLIENT_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - MONGODB_URI
5. Vercel will automatically detect it's a Next.js app and build it
6. Your app will be deployed with a unique URL

### Environment Configuration
- For development: `NEXTAUTH_URL="http://localhost:3000"`
- For production: `NEXTAUTH_URL="https://your-vercel-deployment-url.vercel.app"`

## Security Considerations

- User data is isolated in separate databases per user
- Database access is validated on each session and API call
- Authentication tokens are stored securely
- Input is validated on API routes
- Database credentials are stored in environment variables

## Troubleshooting

### Database Issues
- If a user's database is deleted, they will be automatically logged out
- New databases are created when a user first accesses their subscription data
- Each user gets their own database with the naming convention `vari_<username>_<environment>`

### Authentication Issues
- Make sure Google OAuth redirect URIs are correctly configured
- Verify that NEXTAUTH_SECRET is a random string (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Check that NEXTAUTH_URL matches your deployment URL

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint the codebase

## Next Steps & Enhancements

Potential improvements could include:
- Adding subscription categories or tags
- Adding cost tracking for subscriptions
- Adding renewal date tracking
- Implementing email reminders
- Adding data export functionality
- Implementing user preferences
- Adding subscription sharing between family members

## Technical Architecture

- **Frontend**: Next.js with React
- **Authentication**: NextAuth.js with Google provider
- **Backend**: Next.js API routes
- **Database**: MongoDB with user-specific databases
- **Hosting**: Vercel (recommended) or any Next.js compatible host
- **Authentication Strategy**: JWT-based sessions
- **Database Strategy**: User-specific databases for data isolation