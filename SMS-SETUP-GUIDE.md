# SMS Service Setup Guide

## Using Termii (Free Nigerian SMS Service)

Termii offers **free SMS credits** for testing and development. Follow these steps:

### Step 1: Create Termii Account
1. Visit: https://termii.com/
2. Click "Get Started" or "Sign Up"
3. Fill in your details:
   - Business Name: Javelin Security
   - Email
   - Phone Number
   - Password
4. Verify your email address

### Step 2: Get API Credentials
1. Login to Termii Dashboard: https://accounts.termii.com/
2. Navigate to **"API"** section in the left sidebar
3. You'll see your **API Key** - copy it
4. Navigate to **"Sender ID"** section
5. Create a Sender ID (this is what appears as the sender name):
   - Sender ID: `JAVELIN` or `JavelinSec`
   - Description: Javelin Security System
   - Submit for approval (usually approved within 24 hours)

### Step 3: Get Free Credits
1. New accounts get **FREE TEST CREDITS** automatically
2. For more free credits:
   - Go to **"Billing"** section
   - Look for promotional offers
   - Usually get 50-100 free SMS for testing
3. For production, you can buy credits (very affordable - around ₦2-3 per SMS)

### Step 4: Configure Environment Variables

Add these to your `.env` file in `apps/backend`:

```env
# SMS Service Configuration (Termii)
TERMII_API_KEY=your_api_key_here
TERMII_SENDER_ID=JAVELIN
```

**Example:**
```env
TERMII_API_KEY=TL9xk3vW2KpH7nB5mQ1cD8fY4tR6jX0s
TERMII_SENDER_ID=JAVELIN
```

### Step 5: Restart Backend Server

```bash
cd apps/backend
npm run dev
```

You should see: `✅ SMS Service enabled` in the logs

## Alternative Free SMS Services (if Termii doesn't work)

### Option 2: SMS.to (Global, has free trial)
- Website: https://sms.to/
- Free: 10 test SMS
- Setup:
  ```env
  SMS_PROVIDER=smsto
  SMSTO_API_KEY=your_api_key
  SMSTO_SENDER_ID=JAVELIN
  ```

### Option 3: Infobip (Global, free trial)
- Website: https://www.infobip.com/
- Free: $2 credit (about 50 SMS)
- Setup:
  ```env
  SMS_PROVIDER=infobip
  INFOBIP_API_KEY=your_api_key
  INFOBIP_BASE_URL=xxxxx.api.infobip.com
  INFOBIP_SENDER=JAVELIN
  ```

## Testing Without SMS

If you don't want to set up SMS yet, the system works fine without it:
- Operators will still be registered successfully
- Credentials will be shown on screen
- Director can manually share the credentials
- SMS logs will show in console: `📱 SMS would be sent to: ...`

## SMS Message Format

When an operator is registered, they receive:

```
Welcome to Javelin Security, John Doe!

Employee ID: OPR-12345678-123
Location: Main Office, Lagos
Temporary Password: Opr8x2k9m1p!

Please login to change your password. Contact your supervisor for any questions.
```

## Troubleshooting

### SMS Not Sending?
1. Check environment variables are set correctly
2. Check backend logs for errors
3. Verify Termii API key is valid
4. Ensure Sender ID is approved
5. Check phone number format (must be Nigerian: +234...)

### "SMS Service disabled" in logs?
- TERMII_API_KEY is not set in .env
- Restart backend after adding the key

### SMS sending but not receiving?
- Verify phone number is correct Nigerian format
- Check Termii dashboard for delivery status
- Ensure you have credits remaining
- Check phone has network coverage

## Cost Estimation

**Termii Pricing (Nigeria):**
- Local SMS: ₦2.50 per SMS
- 100 operators = 100 SMS = ₦250 ($0.50)
- Very affordable for business use

**Free Credits:**
- Testing: 50-100 free SMS
- Enough for initial setup and testing

## Phone Number Format

The system automatically handles these formats:
- `+2348012345678` ✅
- `2348012345678` ✅
- `08012345678` ✅
- `8012345678` ✅

All get converted to: `2348012345678` (Termii format)
