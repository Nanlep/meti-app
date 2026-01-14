
# 🚀 Meti Marketing Engine - Production Deployment Guide

## 🏗️ Architecture
We use a **Split Deployment Strategy** for maximum performance and scalability.
*   **Backend (API):** Hosted on **Render.com** (Node.js/Express)
*   **Frontend (UI):** Hosted on **Vercel** (React/Vite)
*   **Database:** **MongoDB Atlas**

---

## 🛠️ Step 1: Deploy Backend (Render)

1.  Push your code to a GitHub repository.
2.  Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3.  Connect your GitHub repo.
4.  **Configuration:**
    *   **Runtime:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server/index.js`
5.  **Environment Variables (Add these in Render):**
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: (Your connection string from MongoDB Atlas)
    *   `API_KEY`: (Your Google Gemini API Key)
    *   `JWT_SECRET`: (Generate a random string)
    *   `BANI_WEBHOOK_SECRET`: (or `BANI_PRIVATE_KEY` depending on your Bani dashboard)
    *   `CLIENT_URL`: (Leave blank for now, come back after Step 2 to add your Vercel URL, e.g. `https://meti-app.vercel.app`)

6.  Click **Create Web Service**.
7.  **Copy your Backend URL** (e.g., `https://meti-backend.onrender.com`).

---

## 🎨 Step 2: Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/new).
2.  Import the same GitHub repository.
3.  **Framework Preset:** Vite (Should detect automatically).
4.  **Environment Variables (Add these in Vercel):**
    *   `VITE_API_URL`: Paste your Render Backend URL (e.g., `https://meti-backend.onrender.com`). **IMPORTANT:** Do not add a trailing slash.
    *   `VITE_BANI_PUBLIC_KEY`: Your Bani Africa Public Key (starts with `pub_...`).
5.  Click **Deploy**.
6.  **Copy your Frontend Domain** (e.g., `https://meti-app.vercel.app`).

---

## 🔗 Step 3: Connect & Secure

1.  **Update Backend CORS:**
    *   Go back to **Render Dashboard** -> Your Service -> **Environment**.
    *   Add/Update `CLIENT_URL` to equal your Vercel Frontend Domain (e.g., `https://meti-app.vercel.app`).
    *   Render will auto-deploy the change.

2.  **Configure Bani Webhook:**
    *   Go to **Bani Africa Dashboard** -> Settings -> Webhooks.
    *   Set the Webhook URL to: `https://YOUR-RENDER-URL.onrender.com/api/webhooks/bani`
    *   Enable events: `payin_successful` (or equivalent).

3.  **Database Access:**
    *   Ensure your MongoDB Atlas "Network Access" allows connections from `0.0.0.0/0` (Allow Anywhere) or specifically whitelist Render's IP addresses.

---

## ✅ Checklist for Live Launch

- [ ] **Payments:** Test the "Starter Plan" project creation fee (₦14,700).
- [ ] **AI Engine:** Verify Niche and Persona generation works on the live URL.
- [ ] **Locks:** Verify Pro features are locked for Starter users.
- [ ] **Webhooks:** Check Render logs to ensure `POST /api/webhooks/bani` returns `200 OK` after a payment.
