
# Meti - AI Marketing Engine (Enterprise Edition)

Meti is an autonomous marketing strategist that uses Google Gemini to define niches, generate personas, write copy, and execute campaigns via real-world integrations.

## 🏗 System Architecture

Meti is built on a **High-Availability (HA)** architecture:

*   **Frontend:** React 18 + Vite (Single Page Application).
*   **Backend:** Node.js Express Cluster (Automatic worker forking for CPU utilization).
*   **Database:** MongoDB (User data, Projects, Leads, Tickets).
*   **AI Core:** Google Gemini API (Models: `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-2.5-flash`).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
*   Node.js v20+
*   MongoDB Instance (Local or Atlas)

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory. **All variables are required for full functionality.**

```env
# Core Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-super-secure-random-string

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/meti

# Intelligence (Google AI Studio)
# Must have 'Google Places API' enabled in GCP Console for Lead Scout features
API_KEY=your_gemini_api_key

# Integrations
RESEND_API_KEY=re_... (For Email Notifications)
AYRSHARE_API_KEY=ayr_... (For Social Posting)
BANI_WEBHOOK_SECRET=your_bani_secret (For Payment Verification)

# Optional: Admin & Test Accounts
ADMIN_EMAIL=admin@meti.pro
ADMIN_PASSWORD=securepassword
TEST_EMAIL=test@meti.pro
```

### 3. Run Application
```bash
# Terminal 1: Backend Server (API, AI Agents, Webhooks)
npm start

# Terminal 2: Frontend Client (UI)
npm run dev
```

---

## 🚢 Production Deployment

The application is configured for **Zero-Downtime Deployment**.

1.  **Build**: `npm run build` (Generates optimized static assets in `dist/`).
2.  **Start**: `npm start` (Serves API and Static Assets via Express).
3.  **Infrastructure**:
    *   **Cluster Mode**: The server automatically forks workers based on available CPU cores via Node.js `cluster` module.
    *   **Security**: `helmet` CSP headers are strict in production. Ensure `CLIENT_URL` is exact.

---

## 🔌 Service Integrations

| Feature | Provider | Requirement |
| :--- | :--- | :--- |
| **AI Strategy** | Google Gemini | `API_KEY` (Paid tier recommended for rate limits) |
| **Lead Scout** | Google Maps | Enable **Places API (New)** in GCP Console linked to Gemini Project |
| **Payments** | Bani Africa | `BANI_WEBHOOK_SECRET` (Backend) + `VITE_BANI_PUBLIC_KEY` (Frontend) |
| **Support Emails** | Resend | `RESEND_API_KEY` |
| **Social Posting**| Ayrshare | `AYRSHARE_API_KEY` (Aggregator for LinkedIn/X/FB) |

## 🛡 Security & Compliance

*   **Role-Based Access Control (RBAC)**: Admin vs User vs Agency roles.
*   **Data Encryption**: Passwords hashed via `bcryptjs`.
*   **Input Sanitization**: Global input cleaning middleware.
*   **Observability**: JSON structured logging via `winston`.
