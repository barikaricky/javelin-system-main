# Configure Netlify Environment Variables

Follow these steps to connect your frontend to the Railway backend:

## Step 1: Add Environment Variable to Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Click on your site: **javelinadmin**
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** or **Add variable**
5. Add the following:

   **Key:** `VITE_API_URL`
   
   **Value:** `https://jevelinbackend-production.up.railway.app/api`

6. Click **Save**

## Step 2: Trigger Redeploy

After adding the environment variable:

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the build to complete

## Step 3: Verify Connection

Once deployed, test your app:

1. Open: https://javelinadmin.netlify.app/login
2. Try logging in with your credentials
3. Check browser console (F12) for any API errors

## Local Development Setup

Your local `.env` file is already configured for localhost:

```env
VITE_API_URL=http://localhost:3002/api
VITE_SERVER_URL=http://localhost:3002
```

### Running Locally:

**Terminal 1 - Backend:**
```bash
cd apps/backend
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
pnpm dev
```

Frontend will be at: http://localhost:5173
Backend will be at: http://localhost:3002

## How It Works

The API configuration in `apps/frontend/src/lib/api.ts` automatically detects:

- **Production (Netlify):** Uses `VITE_API_URL` from environment variables → Railway backend
- **Local Development:** Uses `VITE_API_URL` from `.env` file → localhost:3002

## Troubleshooting

### CORS Issues

If you see CORS errors in the browser console, you need to update Railway backend environment variables:

1. Go to Railway dashboard: https://railway.app
2. Click your backend service
3. Go to **Variables** tab
4. Add or update:
   ```
   CORS_ORIGIN=https://javelinadmin.netlify.app
   ```
5. Redeploy if needed

### API Connection Failed

1. Check Railway backend is running: https://jevelinbackend-production.up.railway.app/api/health
2. Verify environment variable is set correctly in Netlify
3. Check browser console for detailed error messages

## Next Steps

After configuration:
1. ✅ Test login functionality
2. ✅ Verify all API endpoints work
3. ✅ Test file uploads (if applicable)
4. ✅ Monitor Railway logs for any backend errors
