# 🚀 Frontend Deployment to Netlify - Step by Step

## ✅ Prerequisites
- Your code is on GitHub: `https://github.com/barikaricky/javelin-system-main`
- Backend is deploying on Railway (getting URL soon)
- Netlify account ready

---

## 📋 Step 1: Deploy Frontend to Netlify

### 1.1 Go to Netlify Dashboard
1. Open **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**

### 1.2 Connect to GitHub
1. Click **"Deploy with GitHub"**
2. **Authorize Netlify** if first time
3. Search for and select: **javelin-system-main**

### 1.3 Configure Build Settings
Netlify should auto-detect these from `netlify.toml`:

```
Base directory: apps/frontend
Build command: pnpm install && pnpm run build
Publish directory: apps/frontend/dist
```

**Verify these settings are correct!**

### 1.4 Add Environment Variable (CRITICAL!)
Before clicking "Deploy site", scroll down to **"Advanced build settings"**:

1. Click **"Add environment variable"**
2. **Key**: `VITE_API_URL`
3. **Value**: `https://YOUR-RAILWAY-BACKEND-URL.up.railway.app`
   - ⚠️ Get this from Railway after backend deploys
   - ⚠️ NO trailing slash!
   - Example: `https://javelin-backend.up.railway.app`

### 1.5 Deploy!
1. Click **"Deploy javelin-system-main"**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://random-name.netlify.app`

---

## 🔄 Step 2: Get Your Railway Backend URL

### 2.1 Check Railway Deployment
1. Go to **https://railway.app/dashboard**
2. Open your **javelin-system-main** project
3. Click on your **backend service**
4. Go to **Settings** tab
5. Scroll to **"Networking"** section
6. Click **"Generate Domain"** if not already done
7. **Copy the URL**: `https://javelin-backend-xxxx.up.railway.app`

### 2.2 Test Backend is Working
Open in browser or curl:
```bash
https://your-railway-url.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-23T...",
  "environment": "production"
}
```

---

## 🔧 Step 3: Update Frontend with Backend URL

### 3.1 Update Environment Variable in Netlify
1. Go to **Netlify Dashboard** → Your site
2. Go to **Site settings** → **Environment variables**
3. Find `VITE_API_URL`
4. Click **Edit** and update with your Railway URL
5. Click **Save**

### 3.2 Redeploy Frontend
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for rebuild (~2 minutes)

---

## ✅ Step 4: Verify Everything Works

### 4.1 Check Frontend Loads
1. Open your Netlify URL: `https://your-app.netlify.app`
2. Should see the **Login Page**
3. Press **F12** (DevTools) → Check **Console** for errors

### 4.2 Test API Connection
1. Try to login with your credentials
2. Check **Network** tab in DevTools
3. API calls should go to your Railway URL
4. No CORS errors

### 4.3 Full Integration Test
1. Login successfully
2. Navigate to Dashboard
3. Check that data loads
4. Test creating/viewing records

---

## 🎨 Step 5: Customize Your Netlify Site

### 5.1 Change Site Name
1. **Site settings** → **Site details**
2. Click **"Change site name"**
3. Enter: `javelin-security-system` (or your choice)
4. Your URL becomes: `https://javelin-security-system.netlify.app`

### 5.2 Add Custom Domain (Optional)
1. **Domain management** → **Add custom domain**
2. Follow instructions to configure DNS
3. Netlify provides free SSL automatically

---

## 🔄 Auto-Deploy Setup (Already Configured!)

Every time you push to GitHub:
- ✅ Railway auto-deploys backend
- ✅ Netlify auto-deploys frontend

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Both platforms redeploy automatically! 🎉
```

---

## 🛠️ Troubleshooting

### ❌ Frontend Shows "Network Error"
**Problem**: Can't connect to backend

**Fix**:
1. Check `VITE_API_URL` in Netlify environment variables
2. Verify Railway backend is running (check `/api/health`)
3. Check browser console for CORS errors
4. Ensure Railway URL has no trailing slash

### ❌ "Failed to Fetch" on Login
**Problem**: CORS or backend not responding

**Fix**:
1. Check Railway logs for CORS messages
2. Verify backend CORS allows your Netlify domain
3. Check Railway environment variables (DATABASE_URL, JWT_SECRET)

### ❌ Build Fails on Netlify
**Problem**: TypeScript or build errors

**Check**:
1. Netlify build logs
2. Verify `base` directory is `apps/frontend`
3. Check if `pnpm` is available (it should be)

### ❌ Page Refreshes Show 404
**Problem**: React Router not configured

**Fix**: Already handled in `netlify.toml` with redirects:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📊 Your Deployment URLs

### Production URLs:
- **Frontend**: `https://[your-site-name].netlify.app`
- **Backend**: `https://[your-app-name].up.railway.app`
- **Health Check**: `https://[backend-url].up.railway.app/api/health`

### Dashboards:
- **Netlify**: https://app.netlify.com
- **Railway**: https://railway.app/dashboard
- **GitHub**: https://github.com/barikaricky/javelin-system-main

---

## 🎯 Quick Deploy Commands

If you want to deploy manually later:

```bash
# Install Netlify CLI (optional)
npm install -g netlify-cli

# Deploy from frontend directory
cd apps/frontend
netlify login
netlify init
netlify deploy --prod
```

---

## ✅ Deployment Checklist

Backend (Railway):
- [ ] Service deployed and running
- [ ] Health endpoint returns 200 OK
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Domain generated and copied

Frontend (Netlify):
- [ ] Site deployed successfully
- [ ] VITE_API_URL environment variable set
- [ ] Login page loads
- [ ] No console errors
- [ ] API calls work
- [ ] Dashboard accessible

Both:
- [ ] Login works end-to-end
- [ ] Data loads from database
- [ ] Auto-deploy configured
- [ ] Site name customized (optional)

---

## 🎉 Success!

Your Javelin Security Management System is now live on:
- **Frontend**: Netlify (static hosting)
- **Backend**: Railway (Node.js + MongoDB)
- **Database**: MongoDB Atlas (cloud)

**Total deployment time**: ~15 minutes
**Monthly cost**: $0 (free tiers)

🚀 **Your app is production-ready!**
