# Calling CRM Management Application - Context & Specification

## 1. Project Overview
This application is a **Full-Stack Calling CRM System** designed for lead management, Meta Ad campaign integration, automated telecaller lead distribution, post-call tracking, and performance analytics.

- **Frontend Tech Stack**: Expo 57, React Native, Expo Router, Zustand (State Management), React Query v5 (Data Caching), Tailwind CSS / NativeWind, Lucide Icons.
- **Backend Tech Stack**: Node.js, Express.js, MongoDB (Mongoose ORM), Meta Facebook Graph API Integration, JWT Authentication.
- **Primary Brand Theme**: Premium Rose Theme (`#E11D48` primary, `#FFF1F2` background, clean white cards with subtle rose shadows).

---

## 2. Key Features & Functionality

### A. Meta Ad Campaign Ingestion (Zero Lead Loss)
- **Real-Time Webhook (`/api/webhooks/meta`)**: Listens to incoming lead generation form events directly from Facebook/Meta Lead Ads.
- **Zero-Loss Protection**: Ensures no leads are dropped. If a lead contains a malformed or missing phone number, it falls back to saving raw data with a `[URGENT] Invalid Phone` tag so telecallers can manually review it.
- **Automatic Lead Distribution**: Ingested leads are automatically assigned to active telecallers using a cyclic round-robin distribution algorithm.
- **Push Notifications**: Telecallers receive instant notifications upon lead assignment.

### B. Telecaller Workspace & Capabilities
- **Animated Splash Screen**: High-performance animated boot sequence featuring spring-scale logo entrance and glowing pulse effects.
- **Optimized Dashboard**:
  - Displays **Today's Upcoming Follow-ups** with quick-dial access.
  - Quick Action Navigation: **My Leads**, **My Tasks**, **My Report**, **Call Logs**, **Walk-in Leads**.
  - Prominent **"Start Calling Now"** action CTA.
  - Cached state management using `@tanstack/react-query` (`staleTime: 5 mins`) for instant dashboard load times.
- **Leads Directory Screen**:
  - Organized by **Status Categories**: *All Leads*, *Uncontacted / Fresh*, *Connected*, *Follow-up Scheduled*, *Not Connected*, *Rejected*.
  - Organized by **Tags & Labels**: *VIP Leads*, *Urgent Action*, *WhatsApp Needed*, and custom tags.
- **Post-Call Modal & Tagging System**:
  - Pops up after call completion to record call disposition (Interested, Follow Up, Callback, Not Connected, Closed, Rejected, etc.).
  - Allows callers to select preset tags (`VIP`, `Urgent`, `WhatsApp Needed`, `Call Again`) or type custom tags to push the lead into categorized tag buckets.
  - Enables single-tap follow-up date/time scheduling.

### C. Admin Workspace & Analytics
- **Overview Matrix Dashboard**:
  - Monitors Total Leads, Fresh Leads, Assigned Leads, Interested, Follow-ups, Callbacks, Closed Leads, Not Connected, Distributor/Trader Interest.
  - Built-in date filters: *Today*, *Yesterday*, *Last 7 Days*, *This Month*, and *Custom Date Range Picker*.
- **Performance Analytics**:
  - Conversion donut charts and telecaller ranking leaderboards.
- **Lead Operations**:
  - Bulk lead assignment, status filtering, and search capabilities.

---

## 3. Project Structure

```
calling-crm/
├── calling-app-frontend/         # Expo React Native App
│   ├── assets/                   # App icons & brand logos
│   ├── src/
│   │   ├── app/                  # Expo Router Pages
│   │   │   ├── _layout.js        # Root Navigation & Splash Controller
│   │   │   ├── index.js          # Custom Animated Splash Screen
│   │   │   ├── login.js          # Authentication & Demo Credentials
│   │   │   ├── (admin)/          # Admin Dashboard & Analytics
│   │   │   └── (telecaller)/     # Telecaller Workspace, Leads & Reports
│   │   ├── components/           # Reusable Components (CallModal, FAB, etc.)
│   │   ├── store/                # Zustand Global Stores (authStore, themeStore)
│   │   └── services/             # Axios API Config & Endpoints
├── caller-app-backned/           # Express.js Backend Server
│   ├── models/                   # Mongoose Schemas (Lead, User, Call, etc.)
│   ├── routes/                   # API Routes (auth, leads, calls, webhook)
│   ├── middleware/               # Authentication & Error Handling
│   └── server.js                 # Server Entry Point
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT token |
| `GET` | `/api/leads` | Fetch leads list (supports filtering by query, status, and tags) |
| `GET` | `/api/leads/:id` | Fetch single lead details, timeline, and call logs |
| `POST` | `/api/calls` | Log call disposition, schedule follow-up, and attach tags to lead |
| `GET` | `/api/reports/telecaller-dashboard` | Fetch telecaller stats and today's follow-ups |
| `GET` | `/api/reports/admin-dashboard` | Fetch overview matrix metrics and performance analytics |
| `GET/POST` | `/api/webhooks/meta` | Verification and ingestion endpoint for Facebook Meta Lead Ads |

---

## 5. Demo Credentials
- **Admin Login**: `9999999999` / `admin123`
- **Telecaller Login**: `8888888888` / `caller123`
