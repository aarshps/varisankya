# Varisankya - Subscription Tracker Application

A mobile-first Next.js application that allows users to track their subscriptions with Google login and user-specific databases.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Business Flows](#business-flows)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Architecture](#database-architecture)
- [API Endpoints](#api-endpoints)
- [Component Architecture](#component-architecture)
- [UI/UX Design](#uiux-design)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)

## Overview

This application implements:
- Google OAuth authentication using NextAuth.js
- User-specific MongoDB databases for subscription data (vari_<username>_<environment>)
- Protected routes - only authenticated users can access subscription data
- Mobile-responsive UI for subscription management
- Auto-logout when user's database becomes inaccessible
- Integrated login UI at root path `/` instead of separate `/auth/signin`
- Toast notifications for user feedback
- Optimistic UI updates for subscription management
- Independent scrolling for subscription list with fixed composer

## Features

- Mobile-first responsive design
- Google OAuth authentication using NextAuth.js
- Protected routes - content only accessible to authenticated users
- User-specific database creation (vari_<username>_<environment>)
- Subscription CRUD operations (Create, Read, Update, Delete)
- Auto-logout when database access fails
- Optimized for performance
- SEO-friendly with proper meta tags
- Clean, minimal codebase
- Ready for Vercel deployment
- Optimistic UI updates for responsive experience
- Sidebar navigation with overlay behavior
- Scrollable subscription list
- Proper header padding and layout
- Integrated login page at root path `/`
- Toast notifications with auto-dismiss
- Optimistic login UI with "Signing in..." state
- Independent scrolling for subscription list with fixed composer component
- **Detailed Tracking**: Track Name, Last Paid Date, Next Due Date, Status, and Amount.
- **Smart Progress**: Visual progress bar showing days elapsed or remaining.
- **Intelligent Sorting**: Active subscriptions sorted by nearest due date; Inactive ones at the bottom.
- **Optimistic UI**: Instant feedback for all actions (Add, Edit, Delete) with background synchronization.
- **Interactive Details**: Expandable list items to view details and edit inline.
- **Auto-collapsing Views**: Expanded views automatically collapse after 8 seconds or when clicking elsewhere.
- **Enhanced Edit UI**: Smooth animations when opening and closing the edit modal with no flashing.
- **Material 3 (M3E) Animations**: Subtle animations on button clicks and interactions following M3E principles.
- **Negative Elapsed Days Fix**: Ensures elapsed days never show negative values, defaulting to 0.
- **Improved Dropdown Styling**: Properly styled status dropdown with custom arrow in edit modal.
- **Fixed Layout**: Delete button remains in original position when expanded, with additional details appearing below.
- **Updated Favicons**: Added comprehensive favicon set including multiple sizes and formats for all devices.
- **Progress Visualization**: Animated progress bar showing subscription status with color-coded indicators.
- **Database Validation**: Lightweight endpoint to validate database access without fetching data.
- **Session Validation**: Automatic validation of database access on page refresh with auto-logout if database is inaccessible.
- **Single Selection**: Only one expanded subscription view can be open at a time.
- **Click Outside Detection**: Expanded views collapse when clicking elsewhere on the page.
- **Edit Mode Transitions**: Smooth transitions when entering and exiting edit mode.
- **Date Input with Icons**: Enhanced date inputs with calendar icons in edit UI.
- **Custom Select Styling**: Styled dropdown with custom arrow and proper padding.
- **Button Interaction Animations**: Subtle press animations on all interactive buttons.
- **Responsive Design**: Adapts to different screen sizes with mobile-first approach.
- **Chrome Extension**: Basic structure for a companion Chrome extension.
- **Mobile Modal Fix**: Improved add modal scrolling and keyboard handling on mobile devices.
- **UI Logo**: Added application logo to the main header for better branding.
- **Animation Fixes**: Resolved double animation issue when adding new subscriptions.
- **Custom Status Dropdown**: Implemented a custom, styled dropdown for status selection.
- **Responsive Date Pickers**: Improved layout for date inputs to wrap correctly on small screens.
- **Comprehensive API**: Full CRUD operations with proper error handling and validation.

## Business Flows

### User Registration & Authentication Flow
1. New users access the application at root path `/` and see a login page with "Sign in with Google" button
2. User selects Google login option, which shows an optimistic "Signing in..." state
3. User is redirected to Google OAuth for authentication
4. Google redirects user back to application with authentication token
5. Application validates the token and creates a session
6. If user's database doesn't exist, the application creates one automatically using the naming convention `vari_<username>_<environment>`
7. User is redirected to the subscriptions dashboard
8. User's profile information is stored in the `users` collection of their specific database

### Subscription Management Flow
1. Authenticated user navigates to the subscriptions page
2. User sees existing subscriptions (if any) in a scrollable list
3.  **Add Subscriptions**:
    *   Enter a name in the composer at the bottom.
    *   Click the "+" button.
    *   **Edit Details**: Click on the subscription to expand it.
    *   **Set Dates**: Add "Last Paid" or "Next Due" dates to see the progress bar in action.
    *   **Status & Amount**: Track active/inactive status and subscription cost.
    *   **Sorting**: The app automatically sorts items so the most urgent ones are at the top.
5. Backend API call creates the subscription in the user's database
6. If successful, the temporary subscription is updated with server-generated ID
7. If failed, the subscription is removed from the UI
8. User can delete subscriptions by clicking the delete option
9. Frontend optimistically removes the subscription from the UI immediately
10. Backend API call deletes the subscription from the user's database
11. If deletion fails, the subscription list is refreshed from the server

### Navigation Flow
1. User sees sticky header with hamburger icon
2. User clicks hamburger icon to open sidebar navigation
3. Sidebar slides in as overlay (doesn't push content)
4. User sees navigation items at the top and user information at the bottom
5. User can click navigation items or anywhere outside the sidebar to close it
6. User can click sign out to log out and return to login page

### Session Validation Flow
1. When user refreshes the page, application validates database access
2. Application makes a lightweight API call to verify user database still exists
3. If database is accessible, user session continues normally
4. If database is inaccessible (e.g., deleted), user is automatically logged out
5. This prevents users from remaining in invalid session states

## Technical Architecture

### Frontend
- **Framework**: Next.js 14.0.0
- **Language**: JavaScript/React
- **Styling**: CSS Modules with responsive design
- **Authentication**: NextAuth.js hooks (`useSession`, `SessionProvider`)
- **State Management**: React hooks for local state
- **Optimistic Updates**: Implemented for immediate UI feedback

### Backend
- **Framework**: Next.js API routes
- **Authentication**: NextAuth.js with JWT strategy
- **Database**: MongoDB with user-specific databases
- **Security**: Session validation, input validation, authentication checks

### Database
- **Provider**: MongoDB (Atlas recommended)
- **Architecture**: User-specific databases for data isolation
- **Collections**:
  - `users` - stores user profile information
  - `subscriptions` - stores user's subscription data
- **Naming Convention**: `vari_<username>_<environment>`

### Component Architecture
- **Header Component**: Sticky header with hamburger icon and user profile
- **Sidebar Component**: Navigation menu with user information and logout
- **Subscriptions Component**: Main content area with subscription list and composer, featuring independent scrolling container and toast notification system
- **SubscriptionList Component**: Renders subscription items in a scrollable list
- **SubscriptionListItem Component**: Individual subscription item with delete functionality
- **Composer Component**: Input form for adding new subscriptions
- **App Component**: Main layout component managing header, sidebar, and content

## Project Structure

```
varisankya/
├── components/
│   ├── App.js                 # Main layout component
│   ├── Composer.js            # Input form for adding subscriptions
│   ├── Header.js              # Header with hamburger menu
│   ├── Sidebar.js             # Navigation sidebar
│   ├── SidebarNavItem.js      # Individual sidebar navigation item
│   ├── Subscriptions.js       # Main subscriptions page component
│   ├── SubscriptionList.js    # List of subscriptions
│   └── SubscriptionListItem.js # Individual subscription item
├── lib/
│   ├── config.js              # Centralized configuration
│   ├── databaseFactory.js     # Database factory pattern
│   ├── dbValidation.js        # Database validation utilities
│   └── mongodb.js             # MongoDB client setup
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].js  # NextAuth configuration
│   │   ├── db/
│   │   │   └── validate.js       # Database validation endpoint
│   │   ├── subscriptions/
│   │   │   └── index.js          # Subscription CRUD API
│   │   └── user/
│   │       └── index.js          # User profile API
│   ├── _app.js                   # App wrapper with SessionProvider
│   └── index.js                  # Main application page with integrated login UI
├── public/
│   └── favicon.ico
├── styles/
│   └── Home.module.css           # Component-specific styles
├── .env.example                  # Environment variable template
├── .env.local                    # Local environment variables (gitignored)
├── DEVELOPMENT_NOTES.md          # Development documentation (deprecated)
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

Each user's database contains two collections:
- `users` collection: Contains user profile information (email, name, image, preferences, etc.)
- `subscriptions` collection: Contains user's subscription data

### User Database Lifecycle Flow

1. **User Login Process**:
   - When a user logs in via Google OAuth, the application checks if a database already exists for that user
   - If no database exists, the application automatically creates one with the naming convention: `vari_<username>_<environment>`
   - The application then creates a `users` collection in that database and stores the user's profile information
   - If the database already exists, the application updates the user's profile information in the `users` collection

2. **User Profile Management**:
   - The `/api/user` endpoint handles user profile data storage and retrieval
   - User information is stored in the `users` collection within the user's specific database
   - Each user's profile is completely isolated from other users

3. **Page Refresh & Session Validation**:
   - When the user refreshes the page, a session checker validates that the user's database still exists
   - The application makes a test API call to `/api/subscriptions` to verify database accessibility
   - If the database no longer exists or is inaccessible, the user is automatically logged out
   - This prevents users from being stuck in an invalid session state

4. **Subscription Management**:
   - The `/api/subscriptions` endpoint manages all subscription CRUD operations
   - All subscription data is stored in the `subscriptions` collection within the user's database
   - Users can create, read, update, and delete their subscriptions
   - Each user's subscription data is completely isolated from other users

### Database Validation

- The application validates database access during session creation
- If a user's database becomes inaccessible (e.g., deleted), the user is automatically logged out
- The NextAuth authentication uses JWT strategy (not MongoDB adapter) to keep authentication separate from user data
- Each user's data is stored in their own database with complete isolation

## API Endpoints

### Authentication API
- `POST /api/auth/[...nextauth].js` - NextAuth authentication endpoints
- `GET /api/auth/session` - Get current session (internal NextAuth)

### Database Validation API
- `GET /api/db/validate` - Validate user database accessibility

### Subscriptions API
- `GET /api/subscriptions` - Retrieve user's subscriptions
- `POST /api/subscriptions` - Add a new subscription (with optimistic update)
- `PUT /api/subscriptions` - Update an existing subscription (with optimistic update)
- `DELETE /api/subscriptions?id=<id>` - Delete a subscription (with optimistic update)

### User API
- `GET /api/user` - Retrieve user profile
- `POST /api/user` - Update user profile

All endpoints require authentication and validate database access.

## Component Architecture

### App Component
- Main layout wrapper
- Manages header, sidebar and main content positioning
- Handles state for sidebar open/close

### Header Component
- Sticky header with proper inner padding
- Contains hamburger menu for sidebar navigation
- Shows user profile information

### Sidebar Component
- Navigation sidebar that slides in as overlay
- Contains navigation items and user information
- Includes logout functionality

### Subscriptions Component
- Main page content area
- Contains subscription list and composer form
- Handles scrolling when many subscriptions exist

### SubscriptionList Component
- Renders subscription items in an optimized list
- Handles empty state display

### SubscriptionListItem Component
- Individual subscription item with delete functionality
- Optimized rendering with React keys

### Composer Component
- Input form for adding new subscriptions
- Handles form submission and validation

## UI/UX Design

### Layout Design
- Mobile-first responsive design
- Sticky header for consistent navigation access
- Scrollable subscription list with proper max-height
- Overlay sidebar navigation for clean desktop experience
- Proper padding and spacing for touch targets
- Integrated login page at root path `/` instead of separate route
- Independent scrolling for subscription list with fixed composer component at bottom

### Interaction Design
- Optimistic UI updates for immediate feedback
- Smooth animations for sidebar transitions
- Loading states for API operations
- Error handling with user-friendly messages
- Toast notifications that appear at top-right and auto-dismiss after 3 seconds
- Login button with "Signing in..." state during authentication

### Visual Design
- **Material Design 3**: Adheres to modern M3 principles with 16px-24px rounded corners.
- **Typography**: Uses 'Google Sans Flex' for a clean, readable, and premium look.
- **Animations**: Smooth transitions for hover, focus, and active states.
- **Glassmorphism**: Composer pane features a subtle blur effect for depth.
- **Consistent Styling**: Uniform design language across all components (Sidebar, List, Inputs).
- **M3E Animations**: Subtle scale and transition animations on click interactions for enhanced user experience.
- **Comprehensive Favicons**: Complete favicon set including multiple sizes (16x16, 32x32, 192x192, 512x512) and web app manifest for all devices.

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

### Build Process
- `npm run build` - Creates an optimized production build
- Application validates all components and routes during build
- CSS is optimized and inlined for performance

## Security Considerations

- User data is isolated in separate databases per user
- Database access is validated on each session and API call
- Authentication tokens are stored securely with JWT strategy
- Input is validated on API routes
- Database credentials are stored in environment variables
- Session validation on page refresh prevents invalid states
- All API endpoints require authentication
- Database connection is tested before each operation

## Troubleshooting

### Database Issues
- If a user's database is deleted, they will be automatically logged out
- New databases are created when a user first accesses their subscription data
- Each user gets their own database with the naming convention `vari_<username>_<environment>`

### Authentication Issues
- Make sure Google OAuth redirect URIs are correctly configured
- Verify that NEXTAUTH_SECRET is a random string (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Check that NEXTAUTH_URL matches your deployment URL

### UI Issues
- If sidebar doesn't close properly, check that click outside functionality is working
- If subscriptions don't appear after adding, verify database connectivity
- If optimistic updates seem inconsistent, check API response handling

### Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint the codebase

## Development Notes

### Key Principles
- **Database Abstraction**: All database interactions should be abstracted through a factory pattern. This allows for easy switching between different database providers and configurations.
- **User-Specific Databases**: Each user has their own database to ensure data isolation and security.
- **Configuration Management**: All configuration should be managed through the `lib/config.js` file. This includes database connection strings, API keys, and other sensitive information.
- **Session Management**: All session management should be handled by `next-auth`.

### Database Factory
The `databaseFactory.js` file is responsible for creating and managing database connections. It uses a singleton pattern to ensure that only one `MongoClient` instance is created per user.

### Session Management
The `pages/api/auth/[...nextauth].js` file is responsible for handling all authentication and session management. It uses the `next-auth` library to provide a secure and robust authentication system.

### API Routes
All API routes should be placed in the `pages/api` directory. Each route should handle a specific resource and provide a clear and consistent interface.

### Error Handling
All API routes should include robust error handling to ensure that the application is resilient and secure.

### Implemented Features
- **Database Factory**: Implemented a database factory to manage database connections.
- **User-Specific Databases**: Implemented user-specific databases to ensure data isolation.
- **Configuration Management**: Implemented a configuration management system to manage all configuration.
- **Session Management**: Implemented a session management system using `next-auth`.
- **API Routes**: Implemented API routes for subscriptions and user data.
- **Error Handling**: Implemented error handling in all API routes.
- **Fixed `CLIENT_FETCH_ERROR`**: Fixed a `CLIENT_FETCH_ERROR` that was causing users to be logged out when adding a subscription.
- **Fixed database connection issue**: Fixed a database connection issue that was causing a new `MongoClient` instance to be created for each API request.
- **Fixed `unstable_getServerSession` issue**: Fixed an issue where `unstable_getServerSession` was not being used correctly.
- **Fixed `getUserDb` issue**: Moved from `getUserDb` to `getUserDatabase`.
- **Removed `lib/mongodb.js`**: Removed the `lib/mongodb.js` file, as it is no longer needed.
- **Updated `pages/api/user/index.js`**: Updated the `pages/api/user/index.js` file to use `getUserDatabase` instead of `getUserDb`.
- **Optimistic UI Updates**: Implemented optimistic UI updates for subscription add/delete operations for enhanced user experience.
- **Sidebar Overlay**: Implemented sidebar as overlay that doesn't push content.
- **Scrollable Content**: Added scroll functionality to subscription list for when many items are present.
- **Header Padding**: Removed outer container padding and added proper header inner padding.
- **Root Login Page**: Migrated login functionality from `/auth/signin` to root path `/` for better UX
- **Toaster Notifications**: Implemented toast notifications that appear at the top right of the screen and auto-dismiss after 3 seconds
- **Optimistic Login UI**: Added optimistic UI to login button with "Signing in..." state
- **Improved Layout**: Enhanced layout with independent scrolling for subscription list while keeping composer fixed at bottom
- **Auto-collapsing Views**: Implemented auto-collapse functionality for expanded subscription views after 8 seconds or when clicking elsewhere
- **M3E Animations**: Added Material 3 (M3E) animations to button clicks and UI interactions for enhanced user experience
- **Negative Elapsed Days Fix**: Fixed calculation to ensure elapsed days never show negative values
- **Enhanced Edit UI**: Improved edit modal with smooth transitions and no flashing when closing
- **Improved Dropdown Styling**: Fixed styling of status dropdown in edit modal with custom arrow
- **Fixed Layout**: Maintained delete button in original position when expanded view is active
- **Progress Visualization**: Added animated ProgressBar component with color-coded indicators
- **Date Input with Icons**: Enhanced date inputs with calendar icons in edit UI
- **Session Validation**: Added lightweight validation endpoint for database access checks
- **Click Outside Detection**: Implemented functionality to collapse expanded views when clicking elsewhere
- **Single Selection**: Added logic to ensure only one expanded view can be open at a time
- **Edit Mode Transitions**: Implemented smooth transitions when entering/exiting edit mode
- **Comprehensive API**: Added PUT method for subscription updates with optimistic UI
- **Custom Select Styling**: Implemented styled dropdown with custom arrow for status selection
- **Button Animations**: Added subtle press animations on all interactive buttons using M3E principles
- **Updated Favicons**: Added comprehensive favicon set including multiple sizes and formats for all devices