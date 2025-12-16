
# Meti - AI Marketing Engine (Enterprise Edition)

Meti is an autonomous marketing strategist that uses Google Gemini to define niches, generate personas, write copy, and execute campaigns via real-world integrations.

## 🏗 System Architecture

Meti is built on a **High-Availability (HA)** architecture designed for scale:

*   **Frontend:** React 18 + Vite (Single Page Application).
*   **Backend:** Node.js Express Cluster (Automatic worker forking for CPU utilization).
*   **Database:** MongoDB (User data, Projects, Leads).
*   **Cache & Rate Limiting:** Redis (Distributed state management).
*   **AI Core:** Google Gemini API (Models: `gemini-2.5-flash`, `gemini-3-pro-preview`).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
*   Node.js v20+
*   MongoDB Instance (Local or Atlas)
*   Redis Instance (Local or Cloud like Upstash)

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

# Database & Cache
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/meti
REDIS_URL=redis://localhost:6379

# Intelligence (Google AI Studio)
# Must have 'Google Places API' enabled in GCP Console for Lead Scout
API_KEY=your_gemini_api_key

# Integrations (Required for "Execution" features)
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....
AYRSHARE_API_KEY=ayr_...
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
    *   **Redis**: Essential for Rate Limiting. If Redis is down, the API will fail secure defaults.
    *   **Cluster Mode**: The server automatically forks workers based on available CPU cores.
    *   **Security**: `helmet` CSP headers are strict in production. Ensure `CLIENT_URL` is exact.

---

## 🔌 Service Integrations

| Feature | Provider | Requirement |
| :--- | :--- | :--- |
| **AI Strategy** | Google Gemini | `API_KEY` (Paid tier recommended for rate limits) |
| **Lead Scout** | Google Maps | Enable **Places API (New)** in GCP Console |
| **Payments** | Stripe | `STRIPE_SECRET_KEY` (Subscription Products) |
| **Email Ops** | SendGrid | `SENDGRID_API_KEY` + Verified Sender Identity |
| **Social Posting**| Ayrshare | `AYRSHARE_API_KEY` (Aggregator for LinkedIn/X/FB) |

## 🛡 Security & Compliance (ISO 27001)

*   **Distributed Rate Limiting**: Redis-backed sliding window (500 requests / 15 mins).
*   **Strict Quotas**: Token usage is tracked per user in MongoDB. Hard stops applied based on Subscription Tier.
*   **Input Sanitization**: All AI prompts are sanitized to prevent Context Injection.
*   **Observability**: JSON structured logging via `winston` for Datadog/Splunk ingestion.
