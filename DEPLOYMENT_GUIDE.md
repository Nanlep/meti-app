
# 🚀 Meti Marketing Engine - Production Deployment Guide

## 🏗️ Architecture
We use a **Split Deployment Strategy** for maximum performance and scalability.
*   **Backend (API):** Hosted on **Render.com** or **Heroku** (Node.js/Express)
*   **Frontend (UI):** Hosted on **Vercel** or **Netlify** (React/Vite)
*   **Database:** **MongoDB Atlas**

---

## 🛠️ Step 1: Deploy Backend (Render/Heroku)

1.  Push your code to a GitHub repository.
2.  Create a new **Web Service**.
3.  **Configuration:**
    *   **Runtime:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server/index.js`
4.  **Environment Variables (Add these in Dashboard):**
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: (Your connection string from MongoDB Atlas)
    *   `API_KEY`: (Your Google Gemini API Key)
    *   `JWT_SECRET`: (Generate a secure random string)
    *   `RESEND_API_KEY`: (Your Resend.com API Key for emails)
    *   `BANI_WEBHOOK_SECRET`: (From your Bani Africa dashboard settings)
    *   `AYRSHARE_API_KEY`: (Optional: For social posting features)
    *   `CLIENT_URL`: (Leave blank initially, update after Step 2 with Vercel URL)
    *   `ADMIN_EMAIL`: (Optional: To create a default admin account)
    *   `ADMIN_PASSWORD`: (Optional: Password for default admin)

5.  Deploy the service.
6.  **Copy your Backend URL** (e.g., `https://meti-backend.onrender.com`).

---

## 🎨 Step 2: Deploy Frontend (Vercel)

1.  Import the same GitHub repository to Vercel.
2.  **Framework Preset:** Vite (Should detect automatically).
3.  **Environment Variables (Add these in Vercel):**
    *   `VITE_API_URL`: Paste your Backend URL from Step 1 (e.g., `https://meti-backend.onrender.com`). **IMPORTANT:** Do not add a trailing slash.
    *   `VITE_BANI_PUBLIC_KEY`: Your Bani Africa Public Key (starts with `pub_...`).
4.  Click **Deploy**.
5.  **Copy your Frontend Domain** (e.g., `https://meti-app.vercel.app`).

---

## 🔗 Step 3: Connect & Secure

1.  **Update Backend CORS:**
    *   Go back to your Backend Dashboard (Render/Heroku).
    *   Add/Update `CLIENT_URL` to equal your Vercel Frontend Domain (e.g., `https://meti-app.vercel.app`).
    *   Trigger a re-deploy if it doesn't happen automatically.

2.  **Configure Bani Webhook:**
    *   Go to **Bani Africa Dashboard** -> Settings -> Webhooks.
    *   Set the Webhook URL to: `https://YOUR-BACKEND-URL.onrender.com/api/webhooks/bani`
    *   Enable events: `payin_successful` (or equivalent).

3.  **Database Access:**
    *   Ensure your MongoDB Atlas "Network Access" allows connections from `0.0.0.0/0` (Allow Anywhere) or specifically whitelist your backend's IP addresses.

---

## ✅ Checklist for Live Launch

- [ ] **Payments:** Test the "Starter Plan" project creation fee (₦50,000) or Plan Upgrades.
- [ ] **AI Engine:** Verify Niche and Persona generation works on the live URL (ensures Gemini API key is valid).
- [ ] **Emails:** Check if Resend is delivering ticket notifications and welcome emails.
- [ ] **Profile Update:** Verify you can change password/name in Settings.
- [ ] **Webhooks:** Check Backend logs to ensure `POST /api/webhooks/bani` returns `200 OK` after a payment.
