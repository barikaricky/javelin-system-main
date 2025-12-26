# 📧 Gmail Email Setup Guide (2 Minutes!)

Send operator welcome emails using your FREE Gmail account!

## ✅ Why Gmail?

- 🆓 **Completely FREE** - No cost, no credit card needed
- ⚡ **2-minute setup** - Fastest option available
- 🔒 **Secure** - Google's enterprise-grade security
- 📨 **500 emails/day** - More than enough for your needs
- ✅ **No verification required** - Works immediately

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to: **https://myaccount.google.com/security**
2. Scroll to **"2-Step Verification"**
3. Click **"Get Started"** and follow the prompts
4. ✅ Done! (Required for App Passwords)

### Step 2: Create Gmail App Password

1. Go to: **https://myaccount.google.com/apppasswords**
2. Sign in to your Google account
3. You'll see: **"App passwords"** page
4. In the **"Select app"** dropdown, choose **"Mail"**
5. In the **"Select device"** dropdown, choose **"Other"** and type: **"Javelin App"**
6. Click **"Generate"**
7. Google shows a **16-character password** like: `abcd efgh ijkl mnop`
8. **COPY THIS PASSWORD** (you'll only see it once!)

### Step 3: Add to Your .env File

Open `apps/backend/.env` and update:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="youremail@gmail.com"
SMTP_PASS="abcdefghijklmnop"
FROM_EMAIL="youremail@gmail.com"
```

**Replace:**
- `youremail@gmail.com` - Your actual Gmail address
- `abcdefghijklmnop` - The 16-character App Password (remove spaces!)

---

## ✅ Example Configuration

```env
# Example with actual format
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="john.doe@gmail.com"
SMTP_PASS="xyzw abcd efgh ijkl"
FROM_EMAIL="john.doe@gmail.com"
```

---

## 🧪 Test It Now!

1. **Save the `.env` file**

2. **Restart backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

3. **Register a test operator:**
   - Fill in all fields including a valid email
   - Complete the 4-step registration
   - Submit!

4. **Check backend logs:**
   ```
   📧 Attempting to send welcome email to: operator@example.com
   ✅ Welcome email sent successfully to: operator@example.com
   ```

5. **Check the operator's email inbox:**
   - Subject: "Welcome to Javelin Security - Your Account Details"
   - Contains: Employee ID, Location, Password
   - Beautiful HTML email with your branding!

---

## 📨 What the Email Looks Like

The operator receives a professional email with:

```
🛡️ Welcome to Javelin Security!

Hello [Name],

Your operator account has been successfully created.

📋 Your Account Details:

Employee ID: OPR-12345
Email: operator@example.com
Location: Main Office
Temporary Password: Opr7x9k2m!

⚠️ Important: Change your password after first login.

[Login to Your Account Button]
```

Beautiful, professional HTML formatting with your company colors!

---

## 🔍 Troubleshooting

### Issue: "Invalid login" or "Username and Password not accepted"

**Solution:**
1. Make sure you created an **App Password** (not your regular Gmail password)
2. Remove ALL spaces from the App Password: `abcd efgh ijkl mnop` → `abcdefghijklmnop`
3. Make sure 2-Factor Authentication is enabled on your Gmail account

### Issue: Email not received

**Check:**
1. Backend logs show "✅ Welcome email sent successfully"
2. Check operator's **Spam/Junk folder**
3. Verify email address is correct in registration form
4. Check Gmail quota (500 emails/day limit)

### Issue: "Error: getaddrinfo ENOTFOUND smtp.gmail.com"

**Solution:**
- Check your internet connection
- Verify `SMTP_HOST="smtp.gmail.com"` (no typos)
- Restart backend after changing .env

---

## 💰 Limits & Costs

### Gmail Free Account
- **Cost:** FREE ✅
- **Daily Limit:** 500 emails/day
- **Perfect for:** 
  - Development
  - Small to medium deployments
  - Testing

### When You Need More
If you register >500 operators per day:
- Use **Google Workspace** ($6/month)
- Daily limit: 2,000 emails/day
- Professional email address

---

## 🔒 Security Best Practices

1. ✅ **Use App Passwords** - Never use your main Gmail password
2. ✅ **Keep App Password secret** - Don't commit to git
3. ✅ **Rotate passwords** - Generate new App Password every few months
4. ✅ **Use dedicated email** - Consider a dedicated Gmail for your app

---

## 📊 Monitoring

### Check Email Delivery
1. Go to: **https://mail.google.com/mail/u/0/#sent**
2. See all sent emails
3. Check delivery status

### Backend Logs
Watch for:
```
📧 Attempting to send welcome email to: operator@example.com
✅ Welcome email sent successfully to: operator@example.com
```

---

## ✨ Advantages Over SMS

| Feature | Email | SMS |
|---------|-------|-----|
| **Cost** | FREE | $0.02+ per message |
| **Setup Time** | 2 minutes | Complex |
| **Verification** | None needed | Phone verification |
| **Rich Content** | HTML, formatting | Plain text only |
| **Delivery** | Instant | Can be delayed |
| **Records** | Permanent | Limited |

---

## 🎯 Next Steps

After email is working:

1. ✅ Test with multiple operator registrations
2. ✅ Customize email template (optional)
3. ✅ Monitor sent emails in Gmail
4. ✅ Consider dedicated Gmail for production

---

## 🔗 Quick Links

- **App Passwords:** https://myaccount.google.com/apppasswords
- **Security Settings:** https://myaccount.google.com/security
- **Sent Mail:** https://mail.google.com/mail/u/0/#sent

---

## ⏱️ Quick Checklist

- [ ] 2-Factor Authentication enabled on Gmail
- [ ] Created Gmail App Password
- [ ] Copied 16-character password (removed spaces)
- [ ] Updated .env with Gmail address and App Password
- [ ] Set FROM_EMAIL to your Gmail address
- [ ] Restarted backend server
- [ ] Tested operator registration
- [ ] Email received successfully!

---

**That's it! Professional email notifications working in 2 minutes! 🚀**

No signup required. No credit card. No verification. Just works!
