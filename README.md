# Varisankya - Smart Subscription Tracker

Varisankya is a modern, mobile-first Progressive Web App (PWA) designed to help you track and manage your recurring subscriptions effortlessly. With a focus on simplicity, privacy, and speed, it provides a clear view of your financial commitments and payment schedules.

---

## 🌟 Key Features

- **Smart Dashboard**: Automatically sorts subscriptions by urgency (Overdue → Upcoming → Later → Inactive).
- **Visual Progress**: Intuitive progress bars show exactly where you are in each billing cycle.
- **Flexible Recurrence**: Supports Daily, Monthly (specific day), Yearly (specific date), and Manual billing cycles.
- **Privacy First**: **Per-User Database Architecture** ensures your data is completely isolated.
- **Mobile Optimized**: Designed to feel like a native app on your phone with full PWA support.
- **Google Sign-In**: Secure and passwordless authentication via NextAuth.js.
- **Material Design 3**: Modern UI with Google Sans Flex typography and M3 components.
- **Responsive Animations**: Smooth M3 Expressive (M3E) animations for button interactions.
- **Smart Loading**: Unified loading states prevent UI jitter and layout shifts.

---

## 📘 User Manual

### 1. Getting Started

- **Sign In**: Visit the application and click "Sign in with Google". No registration required.
- **Your Space**: Upon login, a dedicated database is created just for you, ensuring your financial data is never mixed with others.
- **PWA Installation**: On mobile, tap "Add to Home Screen" to install as a native-like app.

### 2. Managing Subscriptions

#### Adding a Subscription

1. Click the floating **+** button (bottom right on mobile, or via FAB).
2. Enter the service name (e.g., "Netflix", "Gym").
3. Tap **Add**. The app sets default values (Monthly, Active, 30 days) which you can edit later.

#### Editing & Details

Tap any subscription to expand it, then click the edit (pencil) icon to open the editor.

- **Status**: Toggle between **Active** (paying) and **Inactive** (cancelled).
- **Recurrence Fields** (choose ONE approach):
  - **Option 1: Last Paid + Recurring Days**:
    - **Last Paid Date**: When you last paid for this subscription
    - **Recurring Days**: How many days until it recurs (e.g., 30 for monthly, 365 for yearly)
    - Next Due is automatically calculated
  - **Option 2: Next Due Date Only**:
    - **Next Due Date**: Set the exact date when payment is due
    - Use this for one-time payments or when you know the specific due date
    - Setting this will disable Last Paid and Recurring Days fields

**How it works**:
- If **Next Due** is set → It's used directly (manual mode)
- If **Last Paid + Recurring Days** are set → Next Due = Last Paid + Days
- Update **Last Paid** when you pay (early or late) to recalculate Next Due
- **Edit**: Click the edit (pencil) icon to modify any field
- **Delete**: Click the delete (trash) icon to remove permanently after confirmation

### 3. Understanding the Dashboard

#### The Progress Bar

- **Blue**: Safe zone. The bar fills as the due date approaches.
- **Red**: **Urgent/Overdue**. The bar is nearly full or completely full.
- **Grey**: Inactive subscriptions or subscriptions with no dates set.

#### Smart Sorting

The list is automatically sorted to keep you focused:

1. **Overdue/Most Urgent**: Items with 0 or negative days left (sorted by days left, most urgent first).
2. **Upcoming**: Due soon (sorted by days left ascending).
3. **Later**: Plenty of time left.
4. **Inactive**: Cancelled items sit at the bottom.

#### Auto-Collapse

Expanded subscriptions automatically collapse after 60 seconds of inactivity or when clicking outside the item.

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
- **Validation**: On page load and authentication, the system validates database access before allowing operations.

### Project Structure

```
varisankya/
├── components/              # UI Components
│   ├── App.js              # Main app layout wrapper
│   ├── Button.js           # Reusable M3E button component
│   ├── CustomSelect.js     # Custom styled select dropdown
│   ├── Header.js           # Static header with hamburger & profile
│   ├── IconButton.js       # Reusable icon button with hover effects
│   ├── Loader.js           # Simple circular loading spinner
│   ├── Modal.js            # Modal container with animations
│   ├── MonthSelect.js      # Month picker for yearly recurrence
│   ├── ProgressBar.js      # Visual progress indicator
│   ├── RecurrenceSelect.js # Recurrence pattern selector
│   ├── Sidebar.js          # Navigation sidebar
│   ├── SubscriptionList.js # List container with sorting logic
│   ├── SubscriptionListItem.js # Individual subscription card
│   └── Subscriptions.js    # Main subscriptions view
├── lib/                     # Core Logic
│   ├── databaseFactory.js  # Manages per-user DB connections
│   ├── dbValidation.js     # Ensures DB health
│   └── config.js           # App configuration (env, db names)
├── pages/
│   ├── api/                # Backend Endpoints
│   │   ├── auth/           # NextAuth.js authentication
│   │   ├── db/             # Database validation endpoints
│   │   ├── subscriptions/  # CRUD operations for subscriptions
│   │   └── user/           # User management
│   └── index.js            # Main app page with unified loading
├── public/                  # Static Assets
│   ├── android-logo.png    # App logo
│   ├── favicon.ico         # Browser favicon
│   └── site.webmanifest    # PWA manifest for installation
└── styles/                  # CSS Modules & Global Styles
    ├── Home.module.css     # Component-specific styles
    └── globals.css         # Global app styles & fonts
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
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

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

### Building for Production

```bash
npm run build
npm start
```

### Deployment

The app is ready for [Vercel](https://vercel.com/) deployment.

1. Push to GitHub.
2. Import project in Vercel Dashboard.
3. Set Environment Variables in Vercel.
4. Deploy!

---

## 🧠 Logic & Calculations

### Simplified Recurrence System

The app uses a simple 3-field model:

1. **Last Paid Date** (optional)
2. **Recurring Days** (optional)
3. **Next Due Date** (optional)

**Priority Logic**:
- If `Next Due Date` is set → Use it directly
- If `Last Paid Date + Recurring Days` are set → Calculate: `Next Due = Last Paid + Recurring Days`
- If neither is set → Show "No dates set"

**Real-World Examples**:
- **Monthly Netflix** ($15/month): Last Paid = Jan 15, Recurring Days = 30 → Next Due = Feb 14
- **Annual Insurance** ($500/year): Last Paid = Dec 1, RecurringDays = 365 → Next Due = Nov 30 (next year)
- **Credit Card** (known due date): Next Due = Feb 5 (set directly, no calculation)
- **Early Payment**: Paid on Jan 10 instead of Jan 15 → Update Last Paid to Jan 10, Next Due recalculates to Feb 9

### Progress Calculation

- **Formula**: `((30 - DaysRemaining) / 30) * 100`
- **30-Day Window**: Progress bar fills as subscription approaches due date within 30 days
- **Visualization**:
  - 30+ days left → Bar empty (0%)
  - 15 days left → Bar half full (50%)
  - 0 days left → Bar full (100%)
  - Overdue → Bar full, red color
- **Color Coding**:
  - **Blue** (`#A8C7FA`): Safe (0-70% full)
  - **Red** (`#F2B8B5`): Urgent/overdue (>70% full)
  - **Grey** (`#8E918F`): Inactive or no dates set

### Sorting Algorithm

Subscriptions are sorted in the following priority order:

1. **Status Filter**: Inactive items always go to the bottom.
2. **Days Left Calculation**: Based on next due date and current date.
3. **Ascending Sort**: Items with fewer days left appear first (most urgent on top).
4. **Special Cases**:
   - Manual recurrence with no due date: treated as "distant future" (9998 days).
   - No dates set: treated as "distant future" (9998 days).
   - Inactive: treated as "far bottom" (9999 days).

---

## 🎨 Design & UI Features

### Material Design 3 (M3)

- **Typography**: Google Sans Flex font family throughout.
- **Color Palette**: Dark theme with M3 color tokens.
- **Animations**: M3 Expressive (M3E) animations for:
  - Button press/release (scale transforms)
  - Modal slide-in/slide-out
  - Auto-collapse transitions
  - Hamburger menu slide

### Component Highlights

- **Static Header**: Header never re-mounts or resizes. All containers have fixed dimensions (`flexShrink: 0`) to prevent layout shifts.
- **Unified Loading**: Single loading screen that waits for both session and subscriptions before showing UI, preventing jitter.
- **Auto-Collapse**: Expanded items collapse after 60 seconds or when clicking outside.
- **Delete Confirmation Modal**: Styled modal with M3 animations for delete actions.

### PWA Support

The application includes:

- `site.webmanifest` for app metadata
- Optimized app icons (16x16, 32x32, 192x192, 512x512)
- Apple touch icon for iOS
- Theme color meta tag for Android status bar
- Installable on Android and iOS devices

---

## 🔒 Security & Privacy

### Authentication

- **Google OAuth**: Secure, passwordless authentication via NextAuth.js.
- **Session Management**: Server-side session validation on every API request.
- **Database Validation**: On page load, validates that user's database exists and is accessible before allowing operations.

### Data Isolation

- **Per-User Databases**: Each user's data is in a completely separate MongoDB database.
- **No Data Mixing**: Architectural guarantee that users can never access another user's data.
- **Sanitization**: Usernames are sanitized (dots removed) before database name generation to prevent MongoDB naming conflicts.

### Error Handling

- **Graceful Degradation**: If database access fails, user is signed out and notified.
- **Automatic Recovery**: Invalid sessions automatically redirect to sign-in.
- **User Notifications**: Toast notifications for errors, successes, and important actions.

---

## 📝 API Endpoints

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

### Database

- `GET /api/db/validate` - Validates user's database exists and is accessible

### Subscriptions

- `GET /api/subscriptions` - Fetch all user subscriptions
- `POST /api/subscriptions` - Create new subscription
- `PUT /api/subscriptions` - Update existing subscription
- `DELETE /api/subscriptions` - Delete subscription

### User

- `POST /api/user/create` - Create user database and initial data

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not currently licensed for public use.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Material Design 3](https://m3.material.io/) principles
- Typography by [Google Fonts](https://fonts.google.com/)
- Icons from Material Design Icons

---

**Made with ❤️ by [Aarsh PS](https://github.com/aarshps)**
