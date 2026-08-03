# 🌊 Joy Water Sports - Deployment Guide

This guide explains how to successfully host your full-stack application on **Vercel** or **Render** using a **Supabase PostgreSQL database**.

---

## ⚡ 1. The Secrets Behind Vercel Serverless Deployments

Our application now natively supports **Vercel Serverless Functions**! We have created a custom configuration (`vercel.json` & `/api/index.js`) to handle serverless requests gracefully.

### Why Data Wasn't Storing Correctly Before on Vercel:
1. **The Ephemeral Filesystem**: By default, if the `DATABASE_URL` environment variable is not defined on Vercel, the application falls back to storing data inside localized JSON files (such as `bookings.json`, `users.json`). However, Vercel Serverless instances are stateless and transient. They discard their local filesystems on every single execution cycle, causing stored data to wipe cleanly and go blank!
2. **Missing Environment Configurations**: Without linking your database via Vercel's Environment Variables panel, the API endpoints fail to reach Supabase and time out.
3. **No Root API Redirection**: Without `vercel.json`, requests to `/api/*` were returning `404 Not Found` messages.

With our updated architecture, Vercel will now route edge API requests directly to the compiled Express serverless function while letting the CDN serve static assets with lightspeed response!

---

## 🚀 2. Deploying on Vercel (Step-by-Step)

Follow these steps to deploy properly:

### Step 1: Push Code to GitHub
Ensure all the latest codebase updates are pushed to your GitHub Repository.

### Step 2: Configure Environment Variables in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
2. Select and import your GitHub repository.
3. Scroll down to the **Environment Variables** section and add the following keys:

| Variable Name | Value / Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Your Supabase pooled PostgreSQL URI. **Must start with `postgresql://`** | `postgresql://postgres:pass@db.abc.supabase.co:5432/postgres` |
| `JWT_SECRET` | A secure random string for JWT key validation | `joy_water_sports_secret_token_123!` |
| `NODE_ENV` | Set this to production | `production` |
| `GOOGLE_SHEETS_URL` | *(Optional)* Google Web App endpoint if syncing to sheets | `https://script.google.com/.../exec` |

> ⚠️ **CRITICAL CAPITALS**: Ensure `DATABASE_URL` matches exactly. Without this, Vercel will fall back to local JSON memory which wipes out on every request!

### Step 3: Trigger the Deploy
1. Click **Deploy**. Vercel will execute `npm run build` which compiles the Vite React static frontend to `dist/`, bundles the backend `server.ts` into a self-contained handler `dist/server.cjs`, and starts serving your pages.
2. Once complete, your website will be live!

---

## ☁️ 3. Deploying on Render (Persistent Alternative)

If you prefer a persistent Node web server instead of a stateless serverless architecture, **Render** is your best alternative.

### Step 1: Configure Render App
1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following primary settings:
   - **Name**: `joy-water-sports`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`

### Step 2: Configure Environment Variables in Render
Under the **Environment** tab, configure:
- `DATABASE_URL` (Supabase Connection string)
- `JWT_SECRET` (Secure validation token)
- `NODE_ENV` (Set to `production`)

---

## 🛡️ 4. Initializing Your Admin Credentials

When your database launches for the first time:
1. Navigating to the Admin Portal (`/admin` or click admin-button) will detect an empty database.
2. You will be prompted with a secure **"Security Code / Credentials Initialization"** dialog.
3. This is perfectly safe! Enter a secure, custom username and password from this portal to write your admin credentials directly onto your Supabase PostgreSQL cluster!

*Enjoy smooth bookings on Joy Water Sports! 🏄*
