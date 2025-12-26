# 🚀 Twilio SMS Setup Guide (5 Minutes)

Twilio is the most reliable SMS service globally with excellent Nigerian support and FREE $15 trial credits!

## ✅ Why Twilio?

- ✨ **FREE $15 Trial** - Enough for ~750 SMS messages to Nigeria
- 🌍 **Global Coverage** - Works perfectly in Nigeria
- 🚀 **Instant Setup** - 5 minutes to get started
- 📊 **Real-time Tracking** - See delivery status immediately
- 💯 **99.95% Uptime** - Enterprise-grade reliability

---

## 📋 Quick Setup (5 Steps)

### Step 1: Create Free Twilio Account
1. Go to: **https://www.twilio.com/try-twilio**
2. Fill in your details:
   - Email
   - Password
   - Your phone number (for verification)
3. Click **Start your free trial**
4. Verify your phone number with the code they send

### Step 2: Get Your Credentials
After signing up, you'll see your **Twilio Console Dashboard**:

1. Find these on the dashboard:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal, starts with random letters/numbers)

2. **Copy both** - you'll need them!

### Step 3: Get a Free Phone Number
1. In Twilio Console, click **Get a trial phone number**
2. Twilio will automatically assign you a number (e.g., `+12345678900`)
3. Click **Choose this number**
4. **Copy this number** - you'll need it!

### Step 4: Add Credentials to Your Project
1. Open: `apps/backend/.env`
2. Replace these lines:

```env
TWILIO_ACCOUNT_SID="your_account_sid_here"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
```

With your actual credentials:

```env
TWILIO_ACCOUNT_SID="AC1234567890abcdef1234567890abcd"
TWILIO_AUTH_TOKEN="your_actual_auth_token_here"
TWILIO_PHONE_NUMBER="+12125551234"
```

### Step 5: Verify Your Recipient Numbers (Trial Only)
⚠️ **IMPORTANT for Trial Accounts:**

Twilio trial accounts can ONLY send to **verified phone numbers**.

1. In Twilio Console, go to: **Phone Numbers → Verified Caller IDs**
2. Click **Add a new number**
3. Enter the Nigerian phone number (e.g., `+2348012345678`)
4. Twilio will call or text the number with a verification code
5. Enter the code to verify
6. Repeat for any numbers you want to test with

**Example verified numbers:**
- Your personal phone
- Test operator phone numbers

---

## 🧪 Test the Setup

1. **Restart your backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Look for this in logs:**
   ```
   ✅ SMS Service enabled (Twilio)
   📱 From number: +12125551234
   ```

3. **Register an operator** with a **verified phone number**

4. **Check backend logs** for:
   ```
   📱 Sending SMS via Twilio
   ✅ SMS sent successfully!
   📋 Message SID: SM1234567890abcdef
   ```

5. **Check your phone** - you should receive the SMS!

---

## 💰 Pricing & Free Credits

### Trial Account (FREE)
- **$15.50 in free credits**
- Can send to **verified numbers only**
- Perfect for development and testing
- Credits never expire

### After Trial (If Needed)
- **Nigeria SMS**: ~$0.02 per message (₦30)
- **Very affordable** compared to alternatives
- Pay-as-you-go (no monthly fees)

### Free Credit Usage
With $15.50 free credits, you can send approximately:
- **775 SMS messages** to Nigerian numbers
- More than enough for development and initial deployment!

---

## 🔍 Troubleshooting

### Issue: "SMS not sent - service disabled"
**Solution:** Check that all 3 environment variables are set:
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER
```

### Issue: "Unverified number" error
**Solution:** 
1. Go to Twilio Console → **Verified Caller IDs**
2. Add and verify the recipient's phone number
3. Trial accounts can only send to verified numbers

### Issue: SMS not received
**Check:**
1. Backend logs show "✅ SMS sent successfully"
2. Phone number format is correct: `+2348012345678`
3. Number is verified in Twilio Console (for trial accounts)
4. Check Twilio Console → **Logs** for delivery status

---

## 🎯 Production Upgrade (When Ready)

To send to **any phone number** without verification:

1. **Upgrade your Twilio account:**
   - Go to: Twilio Console → **Settings** → **General**
   - Click **Upgrade your account**
   - Add payment method (credit/debit card)
   - No monthly fees - pay only for what you use!

2. **Get a Nigerian number (Optional):**
   - For better delivery rates in Nigeria
   - Cost: ~$1-2/month
   - Go to: **Phone Numbers → Buy a Number**
   - Select Nigeria (+234) country code

3. **That's it!** You can now send to any Nigerian number.

---

## 📊 Monitoring SMS Delivery

### Real-time Dashboard
1. Go to: Twilio Console → **Monitor** → **Logs** → **Messaging**
2. See all sent messages
3. Track delivery status:
   - ✅ Delivered
   - 🕐 Queued
   - ❌ Failed (with reason)

### In Your App
Check backend logs for:
```
📋 Message SID: SM1234567890abcdef
📊 Status: queued/sent/delivered
```

---

## 🆚 Twilio vs Termii Comparison

| Feature | Twilio | Termii |
|---------|--------|--------|
| **Free Credits** | $15.50 | Limited |
| **Setup Time** | 5 minutes | Complex |
| **Reliability** | 99.95% | Variable |
| **Nigeria Support** | Excellent | Good |
| **Global Coverage** | 180+ countries | Limited |
| **Dashboard** | Best-in-class | Basic |
| **Documentation** | Excellent | Basic |
| **Support** | 24/7 | Business hours |

---

## 🔗 Useful Links

- **Sign Up:** https://www.twilio.com/try-twilio
- **Console:** https://console.twilio.com
- **SMS Pricing:** https://www.twilio.com/sms/pricing
- **Documentation:** https://www.twilio.com/docs/sms
- **Support:** https://support.twilio.com

---

## ✅ Success Checklist

- [ ] Created Twilio account
- [ ] Got Account SID
- [ ] Got Auth Token
- [ ] Got Twilio phone number
- [ ] Added credentials to `.env`
- [ ] Verified recipient phone numbers (trial only)
- [ ] Restarted backend server
- [ ] Tested operator registration
- [ ] Received SMS successfully

---

## 🎉 Next Steps

Once SMS is working:

1. **Test thoroughly** with different phone numbers
2. **Monitor usage** in Twilio Console
3. **Upgrade account** when ready for production (to send to any number)
4. Consider **getting a Nigerian number** for better delivery rates

---

## 💡 Pro Tips

1. **Keep your Auth Token secret** - never commit to git
2. **Use environment variables** for all credentials
3. **Monitor your Twilio balance** regularly
4. **Set up usage alerts** in Twilio Console
5. **Test with multiple phone numbers** before production

---

**Need Help?** Check Twilio's excellent documentation or their 24/7 support!
