# Varisankya - Smart Subscription Tracker

Varisankya is a modern, mobile-first application designed to help you track and manage your recurring subscriptions effortlessly. With a focus on simplicity and speed, it provides a clear view of your financial commitments and payment schedules.

---

## 📘 User Manual

Welcome to Varisankya! This guide will help you get the most out of the application.

### 1. Getting Started
*   **Sign In**: Simply visit the application URL. You will be greeted with a "Sign in with Google" button.
*   **Authentication**: Click the button to securely log in using your Google account. No separate registration is required.
*   **Your Space**: Once logged in, you are taken to your personal dashboard. Your data is private and stored in a dedicated database created just for you.

### 2. Managing Subscriptions

#### Adding a Subscription
1.  **Locate the Button**: On the bottom right of your screen, you'll see a floating **+** button.
2.  **Enter Name**: Click it to open the "Add New Subscription" window. Type the name of the service (e.g., "Netflix", "Gym", "Spotify").
3.  **Confirm**: Tap **Add** or press Enter. The subscription appears instantly in your list.
    *   *Tip*: On mobile, the window adjusts automatically so your keyboard doesn't block the view.

#### Editing Details
Tap on any subscription in the list to expand it. Here you can manage all details:
*   **Name**: Tap the name to correct typos or rename it.
*   **Status**: Toggle between **Active** (currently paying) and **Inactive** (cancelled/paused). Inactive items move to the bottom of your list.
*   **Dates**:
    *   **Last Paid**: Select the date you last made a payment. The app assumes a monthly cycle and calculates the next due date automatically.
    *   **Next Due**: Manually set the next payment date if it differs from the monthly cycle.
    *   *Note*: The app prioritizes "Next Due" for calculations if both are set.

#### Deleting a Subscription
1.  Tap the subscription to expand it.
2.  Tap the **Delete** (trash can) icon.
3.  The item is immediately removed from your dashboard.

### 3. Understanding the Dashboard

#### The Progress Bar
Each subscription has a visual progress bar to show you where you are in the billing cycle:
*   **Blue/Green Bar**: You are within the billing cycle. The bar fills up as the due date approaches.
*   **Red Bar (Full)**: The payment is **Overdue**. These items jump to the top of your list so you don't miss them.
*   **Text Indicators**:
    *   *"5 days left"*: Payment is due in 5 days.
    *   *"2 days ago"*: Payment was due 2 days ago (Overdue).

#### How Progress is Calculated
Understanding how your progress bar is calculated can help you make the most of Varisankya:
*   **Primary Date**: The app prioritizes your "Next Due" date if set.
*   **Fallback Date**: If only "Last Paid" is set, it calculates the next due as exactly one month later.
*   **30-Day Cycle**: The app assumes a standard 30-day billing cycle for progress calculation.
*   **Visual Examples**:
    *   If 15 days remain: progress bar shows 50% completion
    *   If 5 days remain: progress bar shows 83% completion (approaching due date)
    *   If overdue by 2 days: progress bar shows 100% (full red) to indicate urgency

#### Smart Sorting
The list organizes itself automatically to keep you focused:
1.  **Urgent**: Overdue items are always at the top.
2.  **Upcoming**: Items due soon appear next.
3.  **Later**: Items with plenty of time left follow.
4.  **Inactive**: Cancelled or paused subscriptions sit at the bottom.

#### Technical Details of Calculations
For developers and power users, here are the precise algorithms used:
*   **Days Left Calculation**: `daysLeft = (nextDueDate - today) / (24 * 60 * 60 * 1000)`
*   **Progress Calculation**: `(30 - daysLeftRaw) / 30 * 100`, capped at 0-100%
*   **Sorting Priority**: Items with lowest days left (including negative values) appear first
*   **Special Values**: Inactive items = 9999 (bottom), no dates = 9998 (near bottom)

### 4. Mobile Experience
*   **Scroll-Away Button**: As you scroll down your list, the **+** button slides away to give you a full view of your content. Scroll up slightly to bring it back.
*   **Touch-Friendly**: All buttons and inputs are sized for easy tapping.
*   **App-Like Feel**: Add the website to your Home Screen for a native app experience, complete with a custom icon.

---

## 🛠️ Technical Documentation

### Architecture Overview
*   **Frontend**: Next.js 14 (React) with a mobile-first responsive design.
*   **Backend**: Next.js API Routes serving as a serverless backend.
*   **Database**: MongoDB. Uniquely, each user gets their **own dedicated database** (`vari_<username>_<env>`) for maximum data isolation and privacy.
*   **Auth**: NextAuth.js using Google OAuth 2.0.

### Key Features
*   **Optimistic UI**: All actions (Add, Edit, Delete) update the interface immediately while syncing with the server in the background.
*   **Session Validation**: Automatic checks ensure database connectivity; users are auto-logged out if their database becomes inaccessible.
*   **Material Design 3**: UI components follow M3 guidelines, featuring smooth animations, rounded corners, and dynamic interactions.
*   **Image Optimization**: Next.js Image component with optimized loading and proper domain configuration for profile pictures and assets.

### Project Structure
```
varisankya/
├── components/         # React UI components (Subscriptions, List, Modal)
├── pages/
│   ├── api/            # Backend API endpoints
│   └── index.js        # Main application entry point
├── lib/                # Utilities (Database factory, Config)
├── public/             # Static assets (app icons, etc.)
└── styles/             # CSS Modules and Global styles
```

### Setup & Deployment

#### Prerequisites
*   Node.js v14+
*   MongoDB Connection URI
*   Google OAuth Credentials

#### Local Development
1.  Clone the repo and install dependencies:
    ```bash
    npm install
    ```
2.  Configure `.env.local`:
    ```env
    MONGODB_URI=...
    CLIENT_ID=...
    CLIENT_SECRET=...
    NEXTAUTH_SECRET=...
    ```
3.  Run the server:
    ```bash
    npm run dev
    ```

#### Deployment
Ready for Vercel. Simply connect your repository and set the environment variables in the Vercel dashboard.

### Creating Proper App Icons
To create Android app icons with large, clear text that displays properly when installed:

1. **Recommended Icon Sizes**: Create PNG icons at these sizes:
   *   `192x192.png` - Used for Android app installation
   *   `512x512.png` - Used for high-resolution displays
   *   `16x16.png`, `32x32.png` - Used for browser tabs
   *   `180x180.png` - Used for iOS home screen

2. **Design Guidelines** for visible text on icons:
   *   Use bold, sans-serif font (like Google Sans used in the app)
   *   Ensure text size is at least 40% of icon height for 192x192
   *   Use high contrast colors (e.g., light text on dark background or vice versa)
   *   Keep text simple - just "Varisankya" without extra elements
   *   Consider using the "V" from "Varisankya" as a visual symbol if text is too small
   *   Avoid complex graphics that don't scale well at small sizes

3. **Implementation**:
   *   Place icons in the `public/` directory
   *   Update `site.webmanifest` to reference new icons
   *   Add proper link tags in your HTML head for browser compatibility

4. **Testing**:
   *   Use Chrome DevTools Application tab to test PWA installation
   *   Test actual installation on Android device to verify icon display

---

### Security
*   **Data Isolation**: User data is strictly separated at the database level.
*   **Protected Routes**: Middleware ensures only authenticated requests reach the API.
*   **Input Validation**: All incoming data is sanitized and validated.