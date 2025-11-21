# Varisankya - Smart Subscription Tracker

Varisankya is a modern, mobile-first web application designed to help you track and manage your recurring subscriptions effortlessly. With a focus on simplicity, privacy, and speed, it provides a clear view of your financial commitments and payment schedules.

---

## 🌟 Key Features

-   **Smart Dashboard**: Automatically sorts subscriptions by urgency (Overdue → Upcoming → Later).
-   **Visual Progress**: Intuitive progress bars show exactly where you are in each billing cycle.
-   **Flexible Recurrence**: Supports Daily, Monthly, Yearly, and Manual billing cycles.
-   **Privacy First**: **Per-User Database Architecture** ensures your data is completely isolated.
-   **Mobile Optimized**: Designed to feel like a native app on your phone.
-   **Google Sign-In**: Secure and passwordless authentication via NextAuth.js.

---

## 📘 User Manual

### 1. Getting Started
*   **Sign In**: Visit the application and click "Sign in with Google". No registration required.
*   **Your Space**: Upon login, a dedicated database is created just for you, ensuring your financial data is never mixed with others.

### 2. Managing Subscriptions

#### Adding a Subscription
1.  Click the floating **+** button (bottom right).
2.  Enter the service name (e.g., "Netflix", "Gym").
3.  Tap **Add**. The app sets default values (Monthly, Active) which you can edit later.

#### Editing & Details
Tap any subscription to expand it.
*   **Status**: Toggle between **Active** (paying) and **Inactive** (cancelled).
*   **Recurrence**:
    *   **Every X Days**: Fixed cycle (e.g., every 28 days).
    *   **Monthly**: Fixed day of the month (e.g., 15th). *Handles short months automatically.*
    *   **Yearly**: Fixed date (e.g., Dec 25).
    *   **Manual**: You manually set the next due date.
*   **Dates**:
    *   **Last Paid**: The date you last paid.
    *   **Next Due**: Calculated automatically based on recurrence, or set manually.

#### Deleting
1.  Expand the subscription.
2.  Click the **Delete** (trash can) icon.
3.  Confirm to remove it permanently.

### 3. Understanding the Dashboard

#### The Progress Bar
*   **Blue/Green**: Safe zone. The bar fills as the due date approaches.
*   **Red**: **Overdue**. The bar is full and the item jumps to the top.

#### Smart Sorting
The list is automatically sorted to keep you focused:
1.  **Overdue**: Urgent attention needed.
2.  **Upcoming**: Due soon.
3.  **Distant**: Plenty of time left.
4.  **Inactive**: Cancelled items sit at the bottom.

---

## 🛠️ Technical Architecture

Varisankya is built with a modern stack focusing on performance and strictly isolated data storage.

### Tech Stack
*   **Frontend**: [Next.js 14](https://nextjs.org/) (React)
*   **Backend**: Next.js API Routes (Serverless)
*   **Database**: [MongoDB](https://www.mongodb.com/)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
*   **Styling**: CSS Modules with global styles, using **Google Sans Flex** font.

### 🔐 Unique Database Architecture
Unlike typical multi-tenant apps that store all users' data in one table, Varisankya uses a **Per-User Database** pattern:
*   **Isolation**: Each user gets their own database (e.g., `vari_<username>_<env>`).
*   **Security**: Data leakage between users is architecturally impossible at the query level because a user's session only grants access to their specific database connection.
*   **Scalability**: The `DatabaseFactory` manages connections dynamically, creating them on the fly as needed.

### Project Structure
```
varisankya/
├── components/         # UI Components (SubscriptionList, ListItem, etc.)
├── lib/                # Core Logic
│   ├── databaseFactory.js  # Manages per-user DB connections
│   ├── dbValidation.js     # Ensures DB health
│   └── config.js           # App configuration
├── pages/
│   ├── api/            # Backend Endpoints
│   └── index.js        # Main App
├── public/             # Assets (Icons, Manifest)
└── styles/             # CSS Modules & Global Styles
```

---

## 💻 Development Guide

### Prerequisites
*   Node.js v14+
*   MongoDB instance (local or Atlas)
*   Google OAuth Client ID & Secret

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/varisankya.git
    cd varisankya
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root:
    ```env
    MONGODB_URI=mongodb://localhost:27017/
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_random_secret_key
    CLIENT_ID=your_google_client_id
    CLIENT_SECRET=your_google_client_secret
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000`.

### Deployment
The app is ready for Vercel.
1.  Push to GitHub.
2.  Import project in Vercel.
3.  Set Environment Variables in Vercel Dashboard.

---

## 🧠 Logic & Calculations

### Recurrence Logic
*   **Monthly Rollover**: If a bill is due on the 31st, and the next month is February, the system automatically clamps the due date to Feb 28th (or 29th) to ensure valid dates.
*   **Calculation Priority**:
    1.  If `Next Due Date` is explicitly set by the user, it is used.
    2.  Otherwise, `Next Due Date` is calculated: `Last Paid Date` + `Recurrence Cycle`.

### Progress Calculation
*   **Formula**: `(30 - DaysRemaining) / 30 * 100`
*   **Visualization**:
    *   The progress bar visualization is capped at a 30-day window.
    *   If a bill is due in 45 days, the bar is empty (0%).
    *   As it enters the 30-day window, the bar starts filling.
    *   0 days left (or overdue) = 100% full.

### PWA Support
The application includes a `site.webmanifest` and optimized icons, allowing it to be installed on Android and iOS devices as a Progressive Web App (PWA).
