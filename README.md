# Aura Mart — Production Next.js E-Commerce Platform

A production-ready, mobile-first e-commerce storefront and merchant admin dashboard built with Next.js 14 App Router, Tailwind CSS, Supabase PostgreSQL, Cloudinary, and Telegram order webhooks.

---

## ✨ Features

- **High-Conversion Storefront**: Responsive bento layout, guest Cash-on-Delivery (COD) checkout, live search autocomplete, and customer order tracking.
- **Abuse-Proof Reviews**: Order-verified buyer reviews with matching phone check, anti-bot honeypot protection, and mandatory admin moderation.
- **Merchant Admin Portal**: Real-time sales analytics, order fulfillment pipeline with courier tracking, automatic WebP product photo compression, and complete store branding controls.
- **Instant Alerts**: Direct Telegram bot notifications on new orders, cancellations, and admin security events.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Components & Route Handlers) |
| **Language & Styling** | TypeScript, Tailwind CSS, Lucide Icons |
| **Database & ORM** | PostgreSQL (Supabase) + Prisma ORM |
| **Image Storage** | Cloudinary (Direct unsigned client-side WebP uploads) |
| **Notifications** | Telegram Bot API Webhook |
| **Hosting** | Vercel (Edge-optimized serverless) |

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd aura-mart
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Populate the required environment variables:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"

# Admin Authentication
ADMIN_SECRET_KEY="your-secure-admin-passcode"

# Cloudinary (Image Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="store_products"

# Telegram Bot (Instant Order Alerts)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://your-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 3. Sync Database Schema
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Zero-Cost Cloud Services Setup Guide

### 1. Supabase (Database)
1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings -> Database**:
   - Copy **Transaction Pooler** (Port `6543`) into `DATABASE_URL` (append `?pgbouncer=true`).
   - Copy **Session Pooler / Direct** (Port `5432`) into `DIRECT_URL`.
3. Run `npx prisma db push` to push schema tables.

### 2. Cloudinary (Product Photos)
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. Copy your **Cloud Name** to `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Under **Settings -> Upload -> Upload Presets -> Add Upload Preset**:
   - Preset Name: `store_products`
   - Signing Mode: **Unsigned**
   - Folder: `products`
4. Set `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="store_products"`.

### 3. Telegram Bot (Order Alerts)
1. Message `@BotFather` on Telegram -> send `/newbot` -> copy HTTP API token to `TELEGRAM_BOT_TOKEN`.
2. Send a message to your bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` to get your `id` for `TELEGRAM_CHAT_ID`.

### 4. Vercel (Production Deployment)
1. Import repository at [vercel.com](https://vercel.com).
2. Add all environment variables from `.env` in the deployment settings.
3. Click **Deploy**.

---

## 🔐 Admin Dashboard Access

- **Discreet Access**: Click the top-left website logo on the homepage or visit `/admin`.
- **Authentication**: Log in with your admin credentials or passcode (`ADMIN_SECRET_KEY`).
- **Review Moderation**: Incoming buyer reviews are held in **Pending Moderation** by default. Click **Accept Review** in the Reviews tab to publish them live to your storefront.

---

## 📜 Key Commands

```bash
npm run dev          # Start local development server
npm run build        # Build production Next.js application
npx tsc --noEmit     # Check TypeScript types
npx prisma db push   # Push Prisma schema updates to PostgreSQL
npx prisma studio    # Open browser GUI for database records
```
