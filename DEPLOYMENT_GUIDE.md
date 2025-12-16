# 🚀 Meti Marketing Engine - Production Deployment Guide

**Current Status:** Developer Preview (Simulated Integrations)
**Target Status:** Live SaaS (Real Integrations)

This guide bridges the gap between the local demo and a revenue-generating product.

---

## 🏗️ Phase 1: Core Infrastructure

### 1. Database (MongoDB Atlas)
The app currently looks for `MONGODB_URI`. If missing, it crashes or hangs.
1.  **Create Cluster:** Go to [MongoDB Atlas](https://www.mongodb.com/atlas). Create an M0 (Free) or M10 (Production) cluster.
2.  **Network Access:** Whitelist `0.0.0.0/0` (Allow all) for easiest cloud deployment, or whitelist your specific backend IP.
3.  **Get Connection String:**
    ```text
    mongodb+srv://<user>:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority
    ```

### 2. AI Intelligence (Google Cloud)
1.  **Gemini API:** Ensure your key in `server/index.js` has a billing account attached at [Google AI Studio](https://aistudio.google.com/) to avoid rate limits.
2.  **Google Maps (Critical):** The "Lead Scout" feature (`StepLeads.tsx`) uses Gemini Grounding.
    *   Go to GCP Console > APIs & Services.
    *   Enable **Google Places API (New)**.
    *   Enable **Google Search API** (if using Search Grounding).

---

## 🔌 Phase 2: "Real" Integrations (Kill the Simulations)

The current code simulates Social Media connections and Email sending. **You cannot ship this without the following changes.**

### A. Social Media (The "Go Live Now" Fix)
**Problem:** Building native OAuth apps for LinkedIn, X, Facebook, and Instagram takes weeks of verification.
**Solution:** Use an aggregator API like **Ayrshare** or **Nango**.

**Implementation Steps:**
1.  **Sign up for Ayrshare:** Get your API Key.
2.  **Backend (`server/index.js`):**
    *   Add a route `/api/social/jwt` that calls Ayrshare to generate a frontend token.
    *   Add a route `/api/social/post` that accepts the ad content and calls Ayrshare's `/post` endpoint.
3.  **Frontend (`components/StepAds.tsx`):**
    *   Find `togglePlatformConnection`.
    *   **Remove:** The mock `window.open` code.
    *   **Add:** The [Ayrshare Social Link](https://docs.ayrshare.com/social-link/) script.
    ```javascript
    // Concept Code
    const link = new SocialLink(userJwt);
    link.open(); // Opens the real connection modal
    ```

### B. Email Marketing
**Problem:** `emailService.ts` currently yields fake progress.
**Solution:** Use **Resend** or **SendGrid**.

1.  **Backend:** Add `/api/email/send`.
2.  **Frontend:** Update `services/emailService.ts` > `sendCampaign`.
    *   Replace the generator loop with a real API call.
    *   Poll the backend for delivery stats.

### C. Payments
**Problem:** `StepPricing.tsx` mocks the checkout.
**Solution:**
1.  **Stripe:** Create products in Stripe Dashboard.
2.  **Env Vars:** Set `STRIPE_SECRET_KEY` in the backend.
3.  **Webhooks:** Uncomment/Implement the webhook handler in `server/index.js` to actually update `user.subscription` upon payment success.

---

## ☁️ Phase 3: Cloud Hosting

### Backend (Render / Railway)
1.  **Repo:** Push code to GitHub.
2.  **Build Command:** `npm install`
3.  **Start Command:** `npm start`
4.  **Environment Variables:**
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000` (or variable)
    *   `API_KEY`: (Gemini Key)
    *   `MONGODB_URI`: (Atlas Connection String)
    *   `JWT_SECRET`: (Run `openssl rand -hex 64` to generate)
    *   `CLIENT_URL`: `https://your-frontend-app.vercel.app` (CRITICAL FOR CORS)

### Frontend (Vercel)
1.  **Framework:** Vite
2.  **Build Command:** `npm run build`
3.  **Output Directory:** `dist`
4.  **Environment Variables:**
    *   `VITE_API_URL`: `https://your-backend-app.onrender.com` (No trailing slash)

---

## 🛡️ Phase 4: Final Safety Checks

1.  **CORS:** Ensure `CLIENT_URL` on backend exactly matches the Vercel URL.
2.  **Data Persistence:** Verify that refreshing the page keeps the user logged in (JWT check).
3.  **Rate Limiting:** `express-rate-limit` is active. Monitor logs for `429` errors if you have many users.
4.  **Error Boundaries:** Verify the "White Screen" fix by intentionally throwing an error in a component during staging.

