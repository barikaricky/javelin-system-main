# 🚀 Deploy Your Javelin System (GitHub → Production)

✅ **Your code is on GitHub!** Now let's deploy it to production in ~10 minutes.

## 📋 Deployment Overview

- **Backend** → Railway (auto-detects `railway.json`)
- **Frontend** → Netlify (auto-detects `netlify.toml`)
- **Database** → MongoDB Atlas (already configured)

---

## 🔧 Part 1: Deploy Backend to Railway

1. Go to **https://railway.app**
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. **Authorize Railway** to access your repositories (if first time)
6. Find and select your **javelin-security-system** repository
7. Railway will detect `railway.json` automatically ✅

### Step 2: Configure Environment Variables

After selecting your repo, click **"Add Variables"** and add these:

```env
DATABASE_URL=mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin
JWT_SECRET=javelin-super-secret-jwt-key-2024-change-in-production
JWT_REFRESH_SECRET=javelin-refresh-secret-key-2024-change-in-production
NODE_ENV=production
PORT=3002
```

**Important**: Change the JWT secrets before going live!

### Step 3: Deploy & Get Your Backend URL

1. Click **"Deploy"** - Railway will build using your `railway.json` config
2. Wait for deployment to complete (~3-5 minutes)
3. Go to **Settings** tab → **Networking**
4. Click **"Generate Domain"** button
5. **Copy your backend URL** (e.g., `https://javelin-backend.up.railway.app`)

✅ **Backend is live!** Test it: `https://your-backend-url.up.railway.app/api/health`

---

## 🌐 Part 2: Deploy Frontend to Netlify

### Step 1: Import Your GitHub Repository

1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. **Authorize Netlify** to access your repositories (if first time)
5. Find and select your **javelin-security-system** repository

### Step 2: Configure Build Settings

Netlify will auto-detect `netlify.toml`, but verify these settings:

- **Base directory**: `apps/frontend`
- **Build command**: `pnpm install && pnpm run build`
- **Publish directory**: `apps/frontend/dist`

Click **"Show advanced"** → **"New variable"** and add:

```env
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

**Replace** `your-railway-backend-url` with the URL from Part 1, Step 3!

### Step 3: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (~2-3 minutes)
3. **Copy your frontend URL** (e.g., `https://javelin-system.netlify.app`)

✅ **Frontend is live!** Open the URL and test the login page

---

## ✅ Part 3: Verify Your Deployment

### Test Backend (Railway)

1. Open: `https://your-railway-url.up.railway.app/api/health`
2. Should see: `{"status":"ok","timestamp":"..."}`
3. Check **Logs** tab in Railway - no errors

### Test Frontend (Netlify)

1. Open your Netlify URL
2. You should see the **Login Page**
3. Open browser DevTools (F12) → Console → Check for errors
4. Try logging in with your credentials

### Test Full Integration

1. Open frontend URL
2. Login with your admin credentials
3. Check that dashboard loads properly
4. Verify API calls work (no CORS errors in console)

---

## 🔧 Troubleshooting

### ❌ Railway Build Fails

**Check Logs:**
- Railway Dashboard → Your Project → **Logs** tab
- Look for build errors

**Common Issues:**
- Missing environment variables → Add them in Variables tab
- `railway.json` not found → Verify it's in root directory
- Node version mismatch → Check `package.json` engines field

### ❌ Netlify Build Fails

**Check Build Logs:**
- Netlify Dashboard → Your Site → **Deploys** → Click on failed deploy

**Common Issues:**
- Missing `VITE_API_URL` → Add in Site settings → Environment variables
- Wrong base directory → Should be `apps/frontend`
- Build command fails → Verify `pnpm` is configured in `netlify.toml`

### ❌ Frontend Can't Connect to Backend

**Symptoms:** Login fails, API errors in console

**Fix:**
1. Verify `VITE_API_URL` in Netlify Environment variables
2. Make sure it matches your Railway backend URL exactly
3. Check for trailing slashes (should NOT have one)
4. After updating, redeploy: **Deploys** → **Trigger deploy**

**CORS Errors:**
- Check Railway logs for CORS messages
- Verify frontend URL is in backend CORS whitelist
- May need to update backend code to allow your Netlify domain

### ❌ Database Connection Issues

**Railway logs show MongoDB errors:**

1. **Check DATABASE_URL** in Railway Variables tab
2. **MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add Railway's IP addresses
3. **Database User Permissions:**
   - MongoDB Atlas → Database Access
   - Verify user `ricky` has read/write access
4. **Connection String Format:**
   ```
   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
   ```

---

## 🎯 Deployment Complete!

### Your URLs:
- **Backend API**: `https://your-app.up.railway.app`
- **Frontend App**: `https://your-app.netlify.app`
- **Health Check**: `https://your-app.up.railway.app/api/health`

### Next Steps:
1. ✅ Test all major features (login, dashboard, assignments)
2. ✅ Update DNS/Custom domain (optional)
3. ✅ Set up monitoring (Railway & Netlify have built-in analytics)
4. ✅ Configure CI/CD (auto-deploy on git push)

### Auto-Deploy Setup:
Both Railway and Netlify automatically redeploy when you push to GitHub!

```bash
# Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# Railway and Netlify automatically detect the push and redeploy! 🎉
```

---

## 📞 Resources

- **Railway Dashboard**: https://railway.app/dashboard
- **Netlify Dashboard**: https://app.netlify.com
- **Railway Docs**: https://docs.railway.app
- **Netlify Docs**: https://docs.netlify.com
- **MongoDB Atlas**: https://cloud.mongodb.com

**Total Deployment Time**: ~10 minutes ⚡
**Your app is LIVE!** 🚀🎉
