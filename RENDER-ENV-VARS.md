# 🔐 Render Environment Variables - Quick Copy

## Copy & Paste These into Render Dashboard

Go to: **Render Dashboard** → **javelin-backend** → **Environment** → **Add Environment Variable**

---

### Core Configuration

```
DATABASE_URL
mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin
```

```
NODE_ENV
production
```

```
PORT
3002
```

---

### JWT Configuration

```
JWT_SECRET
jevelin-prod-jwt-secret-change-this-2025
```

```
JWT_REFRESH_SECRET
jevelin-refresh-prod-secret-change-2025
```

```
JWT_EXPIRES_IN
7d
```

```
JWT_REFRESH_EXPIRES_IN
30d
```

---

### Security

```
ENCRYPTION_KEY
jevelin-encryption-32-char-key
```

```
DEVELOPER_ONBOARDING_TOKEN
JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3
```

---

### CORS & Frontend

```
FRONTEND_URL
https://javelinadmin.netlify.app
```

```
CORS_ORIGIN
https://javelinadmin.netlify.app
```

---

### Email Configuration - Javelin Associates Professional Email

```
SMTP_HOST
mail.javelinassociates.org
```

```
SMTP_PORT
465
```

```
SMTP_SECURE
true
```

```
SMTP_USER
noreply@javelinassociates.org
```

```
SMTP_PASSWORD
your-email-password-here
```

```
FROM_EMAIL
noreply@javelinassociates.org
```

```
FROM_NAME
Javelin Associates
```

```
EMAIL_FROM
noreply@javelin.com
```

---

## ✅ Verification

After adding all variables:
1. Check count: Should have **13+ variables**
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete
4. Test: `https://javelin-backend.onrender.com/api/health`

---

## 🔄 Update Frontend on Netlify

**Netlify Site Configuration** → **Environment Variables**

```
VITE_API_URL
https://javelin-backend.onrender.com
```

Then: **Deploys** → **Trigger Deploy** → **Clear cache and deploy site**
