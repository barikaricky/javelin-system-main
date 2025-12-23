# 🚨 URGENT: Railway Environment Variables Setup

## The Problem:
Manager registration is failing with 500 error because Railway backend cannot connect to MongoDB or is missing environment variables.

---

## ✅ REQUIRED Railway Environment Variables

Go to: **https://railway.app** → Your backend service → **Variables** tab

### Add ALL these variables (copy exactly):

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

SMTP_HOST
smtp.sendgrid.net

SMTP_PORT
587

SMTP_USER
apikey

SMTP_PASSWORD
your-sendgrid-api-key-here

FROM_EMAIL
noreply@jevelin.com

JITSI_DOMAIN
meet.jit.si

SMS_ENABLED
false

UPLOAD_DIR
./uploads

MAX_FILE_SIZE
5242880
```

---

## 🔍 How to Verify It's Working:

### Step 1: Check Railway Logs
1. Go to Railway → Your backend service
2. Click **View Logs** or **Deployments**
3. Look for: `✅ MongoDB connected successfully`
4. If you see MongoDB errors, the DATABASE_URL is wrong

### Step 2: Test Health Endpoint
```bash
curl https://jevelinbackend-production.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

### Step 3: Test Manager Registration
1. Log in as director: https://javelinadmin.netlify.app/login
2. Go to: Personnel Management → Register Manager
3. Fill in the form and submit
4. Should succeed without 500 error

---

## 🐛 Common Issues:

### Issue 1: "Cannot connect to MongoDB"
**Fix**: Check DATABASE_URL is exactly:
```
mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin
```

### Issue 2: "JWT_SECRET is not defined"
**Fix**: Make sure JWT_SECRET and JWT_REFRESH_SECRET are added

### Issue 3: Still getting 500 error
**Fix**: 
1. Check Railway logs for the actual error message
2. Make sure all variables above are added
3. Redeploy if needed (Railway auto-redeploys after adding variables)

---

## ⚡ Quick Checklist:

- [ ] All environment variables added to Railway
- [ ] Railway redeployed (check Deployments tab)
- [ ] Health endpoint returns 200 OK
- [ ] Railway logs show "MongoDB connected successfully"
- [ ] Director can log in successfully
- [ ] Manager registration works without 500 error

---

## 📝 After Setup:

1. **First**: Register the Director account (use token above)
2. **Then**: Log in as Director
3. **Finally**: Register managers, supervisors, etc.

---

**Need help?** Check Railway logs first - they'll show the exact error!
