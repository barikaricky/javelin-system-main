# 🔑 CRITICAL: Director Registration Token

## Your Developer Onboarding Token:

```
JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3
```

---

## ✅ Step-by-Step Fix:

### 1. Add Token to Railway (MOST IMPORTANT!)

1. Go to: **https://railway.app**
2. Click your backend service: **jevelinbackend-production**
3. Go to: **Variables** tab
4. Find or add: `DEVELOPER_ONBOARDING_TOKEN`
5. Set value to: `JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3`
6. Click **Save** (Railway will auto-redeploy - wait 2-3 minutes)

### 2. Register Director on Website

1. Wait for Railway deployment to finish (check: https://railway.app → View Logs)
2. Go to: **https://javelinadmin.netlify.app/dev**
3. Fill in the form:
   - **Developer Token**: `JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3`
   - **Email**: your-email@example.com
   - **First Name**: Your Name
   - **Last Name**: Your Last Name
   - **Phone**: (optional)
4. Click **Create Director Account**
5. **SAVE THE CREDENTIALS** shown on screen (password shown only once!)

### 3. Test Login

1. Go to: **https://javelinadmin.netlify.app/login**
2. Use the credentials from step 2
3. Should successfully log into dashboard!

---

## 🐛 Why You Got 403 Error:

The DEVELOPER_ONBOARDING_TOKEN in Railway didn't match what you entered. This token is a security measure to prevent unauthorized director account creation.

**Solution**: Use the EXACT token above in both places:
- ✅ Railway backend environment variables
- ✅ Director registration form on website

---

## 🔒 Security Note:

After your first director is registered, you can:
1. Remove DEVELOPER_ONBOARDING_TOKEN from Railway (optional)
2. Or change it to prevent others from creating directors

The token is only needed for the FIRST director registration!

---

## ⚡ Quick Check:

Before registering, verify Railway has the token:
1. Railway → Backend Service → Variables
2. Look for: `DEVELOPER_ONBOARDING_TOKEN = JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3`
3. If not there or different, add/update it
4. Wait for redeploy to complete

---

## 🎉 Success Checklist:

- [ ] Token added to Railway
- [ ] Railway redeployed successfully
- [ ] Used exact token on registration form
- [ ] Director account created
- [ ] Credentials saved
- [ ] Successfully logged in

**Your Token Again**: `JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3`

Copy this token carefully - it's case-sensitive!
