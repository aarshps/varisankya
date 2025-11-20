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
*   **Name**: Tap the name to correct typos or rename it. Long names wrap automatically to fit the layout.
*   **Save Button**: The "Save" button remains disabled until you make a change, preventing accidental or unnecessary updates.
*   **Status**: Toggle between **Active** (currently paying) and **Inactive** (cancelled/paused). Inactive items move to the bottom of your list.
*   **Actions**:
    *   **Delete**: Click the red trash icon on the left to remove the subscription.
    *   **Edit**: Click the blue pencil icon to modify details.
    *   **Paid**: Click the green check icon to mark as paid. This button is disabled if no dates are set.
*   **Dates**:
    *   **Last Paid**: Select the date you last made a payment. The app assumes a monthly cycle and calculates the next due date automatically.
    *   **Next Due**: Manually set the next payment date if it differs from the monthly cycle.
    *   *Note*: The app prioritizes "Next Due" for calculations if both are set.

#### Deleting a Subscription
1.  Tap the subscription to expand it.
2.  Tap the **Delete** (red trash can) icon on the left side.
3.  Confirm the deletion in the modal.
4.  The item is immediately removed from your dashboard.

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
   *   **Important for Android Adaptive Icons**: Create icons with 108x108 dp at the center of 512x512 canvas to avoid white padding
   *   For adaptive icons, ensure the safe zone (where content is preserved) is properly defined

3. **Implementation**:
   *   Place icons in the `public/` directory
   *   Update `site.webmanifest` to reference new icons
   *   Add proper link tags in your HTML head for browser compatibility

4. **Testing**:
   *   Use Chrome DevTools Application tab to test PWA installation
   *   Test actual installation on Android device to verify icon display

### Android Adaptive Icon Issue (White Padding)
If your app icon appears small with white padding on Android:

1. **Root Cause**: Android uses adaptive icons that apply a mask to all launcher icons.
   If your icon doesn't account for this, Android adds white padding to fit the mask.

2. **Current Configuration**: The manifest includes `"purpose": "any maskable"` which should allow Android to crop appropriately.

3. **Icon Design Solution**:
   *   Create icons with extra space around the content to account for the adaptive mask
   *   Use 108x108 dp safe area within 512x512 canvas (or equivalent for 192x192)
   *   The safe area represents 66.67% of the canvas size (108/162 ≈ 66.67% for 162x162)

4. **Alternative Approach**:
   *   If the white padding persists, you may need to create a special 512x512 icon with content
     that fills the entire canvas area while maintaining text readability
   *   Consider using a simple, bold design that works well when masked

---

### Security
*   **Data Isolation**: User data is strictly separated at the database level.
*   **Protected Routes**: Middleware ensures only authenticated requests reach the API.
*   **Input Validation**: All incoming data is sanitized and validated.
    *   **Date Logic**:
        *   **Last Paid Date**: Cannot be in the future (max = today).
        *   **Next Due Date**: Cannot be in the past (min = today).
        *   **Local Time**: Validations respect the user's local device time to ensure accuracy.

---

## 🧠 Application Logic & Scenarios

This section details the logical behavior of the Varisankya subscription tracker, explaining how each recurrence type functions, how the "Paid" action affects them, and analyzing real-world scenarios.

### Core Concept
The application calculates the **Next Due Date** and **Progress** dynamically based on two key pieces of data:
1.  **Last Paid Date**: The timestamp of the last successful payment.
2.  **Recurrence Configuration**: The rules defining the cycle.

### 1. Fixed Days Recurrence (`Every X Days`)
**Logic**: The cycle is a simple fixed duration.
-   **Formula**: `Next Due` = `Last Paid Date` + `X Days`.
-   **Progress**: Percentage of time passed within the `X Days` window.

#### Scenarios
| Scenario | Action | Result | Real-World Fit |
| :--- | :--- | :--- | :--- |
| **Standard** | Cycle: 30 Days. Last Paid: Nov 1. | Next Due: Dec 1 (Nov 1 + 30). Days Left: Calculated from today. | ✅ Perfect for prepaid plans (e.g., mobile data, gym). |
| **Early Payment** | Due: Dec 1. User clicks **Paid** on Nov 28. | `Last Paid` becomes Nov 28. Next Due becomes Dec 28 (Nov 28 + 30). | ✅ Correct. The new cycle starts immediately from payment. |
| **Late Payment** | Due: Dec 1. User clicks **Paid** on Dec 5. | `Last Paid` becomes Dec 5. Next Due becomes Jan 4 (Dec 5 + 30). | ✅ Correct. Service usually resumes/renews from payment date. |

### 2. Monthly Recurrence (`Monthly on the Xth`)
**Logic**: The due date is anchored to a specific day of the month.
-   **Formula**: Find the next occurrence of day `X` that is **strictly after** the `Last Paid Date`.
-   **Rollover**: If the current month doesn't have day `X` (e.g., 31st in Feb), it clamps to the last day of that month.

#### Scenarios
| Scenario | Action | Result | Real-World Fit |
| :--- | :--- | :--- | :--- |
| **Standard** | Cycle: 15th. Last Paid: Oct 15. Today: Nov 1. | Next 15th after Oct 15 is **Nov 15**. Status: Active. | ✅ Standard monthly bill (rent, Netflix). |
| **Late Payment** | Due: Nov 15. User clicks **Paid** on Nov 20. | `Last Paid` becomes Nov 20. Logic looks for next 15th after Nov 20 -> **Dec 15**. | ✅ Correct. You paid the Nov bill; next is Dec. |
| **Early Payment** | Due: Nov 15. User clicks **Paid** on Nov 10. | `Last Paid` becomes Nov 10. **Logic**: System detects early payment (before due date) and skips current cycle. Next Due -> **Dec 15**. | ✅ Correct. Prevents "Due in 5 days" immediately after paying early. |
| **Short Month** | Cycle: 31st. Last Paid: Jan 31. | Next 31st after Jan 31 is Feb 31 (Invalid) -> Clamps to **Feb 28/29**. | ✅ Correct. Handles calendar quirks automatically. |

### 3. Yearly Recurrence (`Yearly on MM-DD`)
**Logic**: The due date is anchored to a specific date every year.
-   **Formula**: Find the next occurrence of `MM-DD` that is **strictly after** the `Last Paid Date`.

#### Scenarios
| Scenario | Action | Result | Real-World Fit |
| :--- | :--- | :--- | :--- |
| **Standard** | Cycle: Dec 25. Last Paid: Dec 25, 2023. | Next occurrence after Dec 25, 2023 is **Dec 25, 2024**. | ✅ Annual subscriptions (Amazon Prime, Insurance). |
| **Late Payment** | Due: Dec 25, 2024. User clicks **Paid** on Jan 5, 2025. | `Last Paid` becomes Jan 5, 2025. Next occurrence is **Dec 25, 2025**. | ✅ Correct. |
| **Early Payment** | Due: Dec 25, 2024. User clicks **Paid** on Dec 20, 2024. | `Last Paid` becomes Dec 20, 2024. **Logic**: System detects early payment and skips current cycle. Next Due -> **Dec 25, 2025**. | ✅ Correct. |

### 4. Manual Recurrence (`Manual`)
**Logic**: The user explicitly sets the `Next Due Date`. The `Last Paid Date` is recorded but does not automatically calculate the next due date.
-   **Formula**: `Next Due` = User Input.

#### Scenarios
| Scenario | Action | Result | Real-World Fit |
| :--- | :--- | :--- | :--- |
| **Irregular Bill** | User sets Next Due: Dec 1. | System counts down to Dec 1. | ✅ Ad-hoc payments, friends owing money. |
| **Paid Action** | User clicks **Paid**. | `Last Paid` updates to Today. `Next Due` is cleared (`-`). Status shows "No due date". | ✅ Correct. The item becomes "completed" until the user manually sets a new date. Prevents auto-calculation. |

### "Paid" Button Behavior
When the **Paid** button is clicked:
1.  **Update**: `Last Paid Date` is set to **NOW**.
2.  **Early Payment Check**:
    -   If paying **before** the due date: The system calculates the *next* cycle date (e.g., skips to next month) and sets it as `Next Due Date`.
    -   If paying **on/after** the due date: `Next Due Date` is set to **NULL** (forcing a standard recalculation based on the new `Last Paid Date`).
3.  **Recalculate**: The UI updates immediately (optimistic update) to reflect the new status.
4.  **Disabled State**: The button is disabled if no dates are currently set for the subscription.

### Visual Feedback
-   **Progress Bar**:
    -   **0-50%**: Green (Safe).
    -   **50-85%**: Blue (Approaching).
    -   **85-100%**: Red (Due Soon/Overdue).
-   **Sorting**: Items with the highest progress (most urgent) float to the top.
-   **Status Label**: The "days left" indicator features a subtle bubble background for clear visibility against the dark theme.

### UI Refinements
-   **Typography**: The app uses **Google Sans Flex** throughout for a modern, friendly aesthetic.
-   **Layout**: Optimized for all screen sizes, with special attention to mobile safe areas and touch targets.
-   **Animations**: Smooth transitions for expanding items, modal interactions, and button presses.
-   **Iconography**: Clean, consistent icons for all actions, with color-coding to match the application's status logic.