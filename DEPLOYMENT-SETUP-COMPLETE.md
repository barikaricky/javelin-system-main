# 🚀 Complete Deployment Setup Guide

## Current Status
- ✅ Backend deployed to Railway: https://jevelinbackend-production.up.railway.app
- ✅ Frontend deployed to Netlify: https://javelinadmin.netlify.app
- ⚠️ **NEEDS CONFIGURATION** - Follow steps below

---

## 🔧 Step 1: Configure Railway Backend Environment Variables

Go to: https://railway.app → Your Project → Backend Service → **Variables** tab

Add these environment variables (if not already set):

```env
DATABASE_URL=mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin

NODE_ENV=production
PORT=3002

JWT_SECRET=jevelin-prod-secret-2025-CHANGE-THIS-NOW
JWT_REFRESH_SECRET=jevelin-refresh-prod-2025-CHANGE-THIS-NOW
ENCRYPTION_KEY=jevelin-prod-encryption-32chars

DEVELOPER_ONBOARDING_TOKEN=DEV-JEVELIN-2025-SECURE-TOKEN

FRONTEND_URL=https://javelinadmin.netlify.app
CORS_ORIGIN=https://javelinadmin.netlify.app

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
FROM_EMAIL=noreply@jevelin.com

JITSI_DOMAIN=meet.jit.si
SMS_ENABLED=false

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Important:** After adding variables, Railway will automatically redeploy.

---

## 🌐 Step 2: Configure Netlify Frontend Environment Variables

Go to: https://app.netlify.com → **javelinadmin** site → **Site settings** → **Environment variables**

Add this ONE critical variable:

```
Key: VITE_API_URL
Value: https://jevelinbackend-production.up.railway.app/api
```

⚠️ **CRITICAL:** Make sure the value is EXACTLY:
`https://jevelinbackend-production.up.railway.app/api`

(Note: includes `/api` at the end!)

---

## 🔄 Step 3: Redeploy Frontend

After adding the environment variable:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for build

---

## ✅ Step 4: Verify Deployment

### Test Backend Health:
```bash
curl https://jevelinbackend-production.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-23T...","environment":"production"}
```

### Test Frontend:
1. Open: https://javelinadmin.netlify.app/dev
2. Register Director with:
   - Developer Token: `DEV-JEVELIN-2025-SECURE-TOKEN`
   - Email: your-email@example.com
   - First Name: Your Name
   - Last Name: Your Last Name
3. Save the generated credentials!

### Test Login:
1. Go to: https://javelinadmin.netlify.app/login
2. Use the credentials from director registration
3. Should successfully log in to dashboard

---

## 🐛 Troubleshooting

### "404 Not Found" Error
- ✅ Check: VITE_API_URL is set in Netlify environment variables
- ✅ Check: You redeployed Netlify AFTER adding the variable
- ✅ Check: Backend is running (test health endpoint above)

### CORS Errors
- ✅ Check: CORS_ORIGIN is set in Railway backend variables
- ✅ Check: FRONTEND_URL is set in Railway backend variables
- ✅ Redeploy backend after adding CORS variables

### "Invalid Developer Token"
- ✅ Check: DEVELOPER_ONBOARDING_TOKEN matches in both places
- ✅ Use: `DEV-JEVELIN-2025-SECURE-TOKEN` (exactly)

### Backend Health Check Fails
- ✅ Check: Railway deployment logs for errors
- ✅ Check: MongoDB connection string is correct
- ✅ Verify: Port is set to 3002 or Railway's PORT variable

---

## 📝 What Was Fixed

1. **Backend CORS**: Added Netlify domain to allowed origins
2. **Frontend API**: Fixed double `/api` path issue
3. **Environment Variables**: Configured for production deployment
4. **Health Endpoint**: Backend responds at `/api/health`

---

## 🔐 Security Notes

**IMPORTANT - After First Login:**
1. Change JWT_SECRET to a secure random string (use: `openssl rand -base64 32`)
2. Change JWT_REFRESH_SECRET to another secure string
3. Change ENCRYPTION_KEY to a 32-character random string
4. Consider rotating DEVELOPER_ONBOARDING_TOKEN after director is created

---

## 📊 Monitoring

### Railway Logs:
https://railway.app → Your Project → Backend → **View Logs**

### Netlify Deploy Logs:
https://app.netlify.com → javelinadmin → **Deploys** → Click latest deploy

---

## 🎉 Success Checklist

- [ ] Railway environment variables added
- [ ] Netlify VITE_API_URL variable added
- [ ] Frontend redeployed on Netlify
- [ ] Backend health check returns 200 OK
- [ ] Director registration works
- [ ] Login works
- [ ] Dashboard loads successfully

---

**Need Help?** Check the logs in Railway and Netlify for detailed error messages!
