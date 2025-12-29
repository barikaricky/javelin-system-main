# 🚀 QUICK START - Render Migration

## 📋 What You Need

1. ✅ GitHub account
2. ✅ 10-15 minutes
3. ✅ Your MongoDB connection string (already configured)

---

## ⚡ 3-Step Deployment

### Step 1: Deploy to Render (5 mins)

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect repo: `barikaricky/javelin-system-main`
4. Configure:
   ```
   Name: javelin-backend
   Root Directory: apps/backend
   Environment: Node
   Build: npm install
   Start: npm start
   Plan: FREE
   ```
5. Click **"Advanced"** → Add environment variables from `RENDER-ENV-VARS.md`
6. Click **"Create Web Service"** → Wait 3-5 minutes

**Your backend URL:** `https://javelin-backend.onrender.com`

---

### Step 2: Update Netlify (3 mins)

1. Go to **https://app.netlify.com**
2. Your site → **Site configuration** → **Environment variables**
3. Add/Update:
   ```
   VITE_API_URL
   https://javelin-backend.onrender.com/api
   ```
4. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

### Step 3: Test (2 mins)

✅ Backend: https://javelin-backend.onrender.com/api/health  
✅ Frontend: https://javelinadmin.netlify.app  
✅ Try login + operator registration

---

## 🎯 Environment Variables (Copy to Render)

**Essential variables (copy from RENDER-ENV-VARS.md):**

```
DATABASE_URL=mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin
NODE_ENV=production
PORT=3002
JWT_SECRET=jevelin-prod-jwt-secret-change-this-2025
JWT_REFRESH_SECRET=jevelin-refresh-prod-secret-change-2025
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ENCRYPTION_KEY=jevelin-encryption-32-char-key
DEVELOPER_ONBOARDING_TOKEN=JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3
FRONTEND_URL=https://javelinadmin.netlify.app
CORS_ORIGIN=https://javelinadmin.netlify.app
```

---

## ⚠️ Important

**Free Tier:** Service sleeps after 15 mins → First request takes 30-60s  
**Solution:** Upgrade to $7/mo for always-on OR accept cold starts

---

## 📚 Full Documentation

- **Complete Guide:** `RENDER-DEPLOYMENT-GUIDE.md`
- **All Variables:** `RENDER-ENV-VARS.md`
- **Migration Summary:** `RENDER-MIGRATION.md`

---

## 💰 Savings: $5-20/month → $0/month 🎉
