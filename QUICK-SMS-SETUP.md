# Quick Setup: SMS Service for Operator Registration

## ✅ What's Been Added:

1. **Transaction Support** - Operator registration now uses MongoDB transactions:
   - If anything fails, the entire registration is rolled back
   - No more partial registrations with 400 errors

2. **SMS Service** - Automatic SMS to operators with:
   - Employee ID
   - Location assignment
   - Temporary password
   - Welcome message

3. **Enhanced Success Screen** - Shows:
   - Operator details
   - Credentials (Employee ID, Location, Password)
   - SMS status (sent or not configured)

## 🚀 Setup Steps (5 minutes):

### Step 1: Get Termii Account (FREE)
```
1. Visit: https://termii.com/
2. Sign up with email
3. Get FREE test credits automatically
4. Copy your API key from dashboard
```

### Step 2: Add to Environment Variables

Edit `apps/backend/.env`:
```env
# Add these two lines:
TERMII_API_KEY=your_api_key_from_termii
TERMII_SENDER_ID=JAVELIN
```

### Step 3: Restart Backend
```bash
cd apps/backend
npm run dev
```

Look for: `✅ SMS Service enabled` in logs

## ✅ That's It!

Now when you register an operator:
1. Registration is atomic (all-or-nothing)
2. SMS automatically sent to their phone
3. Success screen shows all details
4. Director can see if SMS was sent

## 📱 SMS Message Example:

```
Welcome to Javelin Security, John Doe!

Employee ID: OPR-12345678-123
Location: Main Office, Lagos
Temporary Password: Opr8x2k9m1p!

Please login to change your password. Contact your supervisor for any questions.
```

## 🧪 Testing Without SMS:

If you don't add TERMII_API_KEY, the system still works:
- Registration completes successfully  
- No SMS is sent
- Success screen shows: "⚠️ SMS not configured"
- Console logs show what SMS would have been sent

## 💰 Cost:

- **Testing**: FREE (50-100 SMS with new account)
- **Production**: ₦2.50 per SMS (~$0.005)
- Very affordable for business use

## 📖 Full Documentation:

See `SMS-SETUP-GUIDE.md` for:
- Detailed Termii setup
- Alternative SMS providers
- Troubleshooting
- Phone number formats
- Cost breakdown

## 🔧 Troubleshooting:

**Backend logs show "SMS Service disabled"?**
- TERMII_API_KEY not in .env file
- Restart backend after adding it

**SMS not received?**
- Check phone number is Nigerian (+234...)
- Check Termii dashboard for delivery status
- Verify you have credits

**Registration failing?**
- Check backend logs for specific error
- Verify all required fields are filled
- Check photo sizes (should be auto-compressed)

## 🎯 What Changed:

**Backend:**
- ✅ `sms.service.ts` - New SMS service with Termii integration
- ✅ `director.routes.ts` - Transaction support + SMS sending
- ✅ Atomic registration (rollback on failure)

**Frontend:**
- ✅ Enhanced success screen with credentials
- ✅ SMS status indicator
- ✅ Shows Employee ID, Location, Password

**Benefits:**
- ✅ No more 400 errors with partial registration
- ✅ Operators receive credentials via SMS
- ✅ Less manual work for directors
- ✅ Professional onboarding experience
