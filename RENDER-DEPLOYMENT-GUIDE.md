# 🚀 Render Deployment Guide - Javelin System

## Why Render?
✅ **FREE tier available** (750 hours/month - enough for 24/7)  
✅ **No credit card required** for free tier  
✅ **Easy MongoDB integration**  
✅ **Auto-deploy from GitHub**  
✅ **Better than Railway pricing**

---

## 📋 Step-by-Step Deployment

### Step 1: Create Render Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account
4. Authorize Render to access your GitHub repositories

---

### Step 2: Deploy Backend to Render

#### A. Create New Web Service
1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `barikaricky/javelin-system-main`
3. Configure the service:

```
Name: javelin-backend
Region: Oregon (US West) - or closest to you
Branch: main
Root Directory: apps/backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

4. Select **"Free"** plan
5. Click **"Advanced"** to add environment variables

---

### Step 3: Add Environment Variables

Click **"Add Environment Variable"** and add each of these:

#### Required Variables (Copy these exactly):

```env
DATABASE_URL
mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin

NODE_ENV
production

PORT
3002

JWT_SECRET
jevelin-prod-jwt-secret-change-this-2025

JWT_REFRESH_SECRET
jevelin-refresh-prod-secret-change-2025

JWT_EXPIRES_IN
7d

JWT_REFRESH_EXPIRES_IN
30d

ENCRYPTION_KEY
jevelin-encryption-32-char-key

DEVELOPER_ONBOARDING_TOKEN
JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3

FRONTEND_URL
https://javelinadmin.netlify.app

CORS_ORIGIN
https://javelinadmin.netlify.app
```

#### Email Variables (Optional - if using email):

```env
SMTP_HOST
smtp.sendgrid.net

SMTP_PORT
587

SMTP_USER
your-sendgrid-username

SMTP_PASSWORD
your-sendgrid-password

EMAIL_FROM
noreply@javelin.com
```

---

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Render will start building your backend
3. Wait 3-5 minutes for deployment
4. Your backend URL will be: `https://javelin-backend.onrender.com`

---

### Step 5: Update Frontend Configuration

#### On Netlify:
1. Go to your Netlify site: https://app.netlify.com
2. Click on your site → **"Site configuration"** → **"Environment variables"**
3. Update or add:

```env
VITE_API_URL
https://javelin-backend.onrender.com
```

4. Click **"Save"**
5. Go to **"Deploys"** → **"Trigger deploy"** → **"Clear cache and deploy site"**

---

### Step 6: Test Your Deployment

1. Open your frontend: https://javelinadmin.netlify.app
2. Try logging in
3. Test operator registration
4. Check if all API calls work

---

## 🎯 Important Notes

### Free Tier Limitations:
- ⏰ **Spins down after 15 minutes of inactivity**
- 🐌 **First request after sleep takes ~30-60 seconds** (cold start)
- 💾 **750 hours/month free** (enough for one service 24/7)
- 🔄 **Auto-deploys on git push**

### How to Keep Service Active:
If you need faster response times, you can:
1. **Upgrade to paid plan** ($7/month for always-on)
2. **Use a cron job** to ping your API every 10 minutes
3. **Accept the cold start** (common for free tiers)

---

## 🔧 Monitoring Your Backend

### View Logs:
1. Go to Render Dashboard
2. Click on **"javelin-backend"**
3. Click **"Logs"** tab
4. See real-time logs and errors

### Check Health:
Visit: https://javelin-backend.onrender.com/api/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-29T..."
}
```

---

## 🚨 Troubleshooting

### Build Failed?
**Check:**
- Root Directory is set to `apps/backend`
- Build Command is `npm install`
- Start Command is `npm start`

### Cannot Connect to MongoDB?
**Check:**
- `DATABASE_URL` environment variable is correct
- MongoDB Atlas allows connections from `0.0.0.0/0` (all IPs)
- Network Access in MongoDB Atlas is configured

### CORS Errors?
**Check:**
- `FRONTEND_URL` matches your Netlify URL exactly
- `CORS_ORIGIN` matches your Netlify URL exactly
- No trailing slashes in URLs

### 500 Errors?
**Check Render logs:**
1. Dashboard → javelin-backend → Logs
2. Look for error messages
3. Check environment variables are set

---

## 🎉 Success Checklist

- [ ] Render account created
- [ ] Backend deployed to Render
- [ ] All environment variables added
- [ ] Backend URL copied: `https://javelin-backend.onrender.com`
- [ ] Frontend environment variable updated on Netlify
- [ ] Frontend redeployed
- [ ] Login tested
- [ ] Operator registration tested
- [ ] All features working

---

## 💰 Cost Comparison

| Service | Railway | Render Free | Render Paid |
|---------|---------|-------------|-------------|
| Cost | $5-20/mo | $0/mo | $7/mo |
| Always On | ✅ | ❌ | ✅ |
| Cold Starts | ❌ | ✅ (30-60s) | ❌ |
| Build Minutes | Limited | 500/mo | Unlimited |

---

## 🔄 Auto-Deploy Setup

Your backend will automatically deploy when you push to GitHub:

1. Make changes to your code
2. Commit and push to `main` branch
3. Render automatically detects changes
4. Builds and deploys new version
5. Takes ~3-5 minutes

---

## 📞 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Community:** https://community.render.com

---

## ✅ Next Steps After Deployment

1. **Test all features** thoroughly
2. **Monitor logs** for first few days
3. **Set up health check monitoring** (optional)
4. **Consider upgrading** if cold starts are problematic
5. **Update documentation** with new backend URL

**Your new backend URL:** `https://javelin-backend.onrender.com`

Good luck! 🚀
