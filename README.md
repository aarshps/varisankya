# Varisankya - Smart Subscription Tracker

Varisankya is a modern, mobile-first Progressive Web App (PWA) designed to help you track and manage your recurring subscriptions effortlessly. With a focus on simplicity, privacy, and speed, it provides a clear view of your financial commitments and payment schedules.

---

## 🌟 Key Features

- **Smart Dashboard**: Automatically sorts subscriptions by urgency (Overdue → Upcoming → Later → Inactive).
- **Flexible Billing Cycles**: Supports Monthly, Yearly, Weekly, Daily, and **Custom Intervals** (e.g., every 28 days for prepaid plans).
- **Visual Progress**: Intuitive progress bars show exactly where you are in each billing cycle.
- **Undo Delete**: Accidentally deleted a subscription? Restore it instantly with a 5-second undo window.
- **Privacy First**: **Per-User Database Architecture** ensures your data is completely isolated.
- **Mobile Optimized**: Designed to feel like a native app with full PWA support, touch-friendly controls, and auto-hiding floating buttons.
- **Google Sign-In**: Secure and passwordless authentication via NextAuth.js.
- **Material Design 3**: Modern UI with Google Sans Flex typography, dark mode, and M3 components.
- **Smooth Animations**: Fluid transitions for list expansion, item entry/exit, and UI interactions.

---

## 📘 User Manual

### 1. Getting Started

- **Sign In**: Visit the application and click "Sign in with Google". No registration required.
- **Your Space**: Upon login, a dedicated database is created just for you, ensuring your financial data is never mixed with others.
- **PWA Installation**: On mobile, tap "Add to Home Screen" to install as a native-like app.

### 2. Managing Subscriptions

#### Adding a Subscription

1. Click the floating **+** button (bottom right).
2. Enter the service name (e.g., "Netflix", "Gym").
3. Select the billing cycle (Monthly, Yearly, or Custom Days).
4. Tap **Add**. The subscription is added and automatically sorted into the list.

#### Managing Subscriptions

**Tap any subscription** to expand it.

Expanded view shows:
- **Edit Details**: Update name, cost, currency, billing cycle, and due date.
- **Delete Button**: Click to remove the subscription. You'll have 5 seconds to undo this action.

### 3. Understanding the Dashboard

#### The Progress Bar

- **Blue**: Safe zone. Days left until due date.
- **Red**: Urgent or overdue.
- **Grey**: No due date set yet.

#### Smart Sorting

The list is automatically sorted by Next Due Date:

1. **Most Urgent**: Soonest due dates appear first.
2. **Later**: Future due dates follow.
3. **No Date Set**: Items without due dates sit at the bottom.

---

## 🛠️ Technical Architecture

Varisankya is built with a modern stack focusing on performance and strictly isolated data storage.

### Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (React 18)
- **Backend**: Next.js API Routes (Serverless)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Google OAuth
- **Styling**: CSS Modules with global styles, using **Google Sans Flex** font

### 🔐 Unique Database Architecture

Unlike typical multi-tenant apps that store all users' data in one table, Varisankya uses a **Per-User Database** pattern:

- **Isolation**: Each user gets their own database (e.g., `vari_<username>_<env>`).
- **Security**: Data leakage between users is architecturally impossible at the query level because a user's session only grants access to their specific database connection.
- **Scalability**: The `DatabaseFactory` manages connections dynamically, creating them on the fly as needed.

### Project Structure

```
varisankya/
├── components/              # UI Components
│   ├── AppNameComponent.js # Branding
│   ├── DatePickerComponent.js # Custom date picker
│   ├── DropdownComponent.js # Custom styled dropdown
│   ├── FloatingButtonComponent.js # FAB with scroll logic
│   ├── HeaderComponent.js  # App header
│   ├── ListComponent.js    # Subscription list container
│   ├── ListItemComponent.js # Individual subscription card
│   ├── Loader.js           # Loading spinner
│   ├── LogoComponent.js    # App logo
│   ├── Modal.js            # Generic modal wrapper
│   ├── PageContentComponent.js # Layout wrapper
│   ├── SubscriptionForm.js # Add/Edit form
│   └── UserComponent.js    # User profile & logout
├── lib/                     # Core Logic
│   ├── colors.js           # Global color constants
│   ├── databaseFactory.js  # Manages per-user DB connections
│   ├── dbValidation.js     # Ensures DB health
│   └── config.js           # App configuration
├── pages/
│   ├── api/                # Backend Endpoints
│   │   ├── auth/           # NextAuth.js authentication
│   │   └── subscriptions/  # CRUD operations
│   └── index.js            # Main app page
├── public/                  # Static Assets
└── styles/                  # CSS Modules & Global Styles
    ├── Home.module.css     # Component-specific styles
    └── globals.css         # Global app styles
```

---

## 💻 Development Guide

### Prerequisites

- Node.js v14+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Google OAuth Client ID & Secret ([Google Cloud Console](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/aarshps/varisankya.git
   cd varisankya
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root:

   ```env
   # MongoDB Connection URI
   MONGODB_URI=mongodb://localhost:27017/

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_key_here

   # Google OAuth Credentials
   CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   CLIENT_SECRET=your_google_client_secret
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Made with ❤️ by [Aarsh PS](https://github.com/aarshps)**
