# Deployment Guide

## Backend - Railway

### 1. Install Railway CLI
```bash
pnpm add -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Project
```bash
cd /c/Users/user/Documents/GitHub/javelin-system-main
railway init
```

### 4. Add MongoDB (if needed)
```bash
railway add
# Select MongoDB from the list
```

### 5. Set Environment Variables
```bash
railway variables set DATABASE_URL="mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/javelin_db?retryWrites=true&w=majority&appName=Javelin"
railway variables set JWT_SECRET="your-secure-secret-here-min-32-chars"
railway variables set JWT_REFRESH_SECRET="another-secure-secret-here"
railway variables set NODE_ENV="production"
railway variables set PORT="3002"
railway variables set FRONTEND_URL="https://your-netlify-url.netlify.app"
railway variables set DEVELOPER_ONBOARDING_TOKEN="your-secure-token"
```

### 6. Deploy
```bash
railway up
```

### 7. Get Backend URL
```bash
railway domain
```
Copy the URL (e.g., `https://javelin-backend.up.railway.app`)

---

## Frontend - Netlify

### 1. Install Netlify CLI
```bash
pnpm add -g netlify-cli
```

### 2. Login to Netlify
```bash
cd /c/Users/user/Documents/GitHub/javelin-system-main/apps/frontend
netlify login
```

### 3. Initialize Site
```bash
netlify init
```
- Choose "Create & configure a new site"
- Select your team
- Enter site name: `javelin-frontend`

### 4. Update Environment Variable
Edit `apps/frontend/src/lib/api.ts` and add:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://javelin-backend.up.railway.app';
```

### 5. Set Netlify Environment Variable
```bash
netlify env:set VITE_API_URL "https://javelin-backend.up.railway.app"
```

### 6. Deploy
```bash
netlify deploy --prod
```

---

## Post-Deployment

### Update Backend CORS
After getting Netlify URL, update Railway backend:
```bash
railway variables set FRONTEND_URL="https://javelin-frontend.netlify.app"
```

### Update Frontend API URL
If backend URL changes, update Netlify:
```bash
netlify env:set VITE_API_URL "https://new-backend-url.railway.app"
netlify deploy --prod
```

---

## Quick Deploy (Alternative)

### Railway (GitHub Integration)
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory: `apps/backend`
5. Add environment variables in Railway dashboard
6. Railway auto-deploys on push

### Netlify (GitHub Integration)
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import existing project"
3. Select your repository
4. Set:
   - Base directory: `apps/frontend`
   - Build command: `pnpm install && pnpm run build`
   - Publish directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Netlify auto-deploys on push

---

## Environment Variables Reference

### Backend (Railway)
- `DATABASE_URL` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret
- `NODE_ENV` - "production"
- `PORT` - 3002 (Railway auto-assigns)
- `FRONTEND_URL` - Netlify URL for CORS
- `DEVELOPER_ONBOARDING_TOKEN` - Initial director creation token

### Frontend (Netlify)
- `VITE_API_URL` - Railway backend URL

---

## Quick Start Commands

```bash
# Install CLIs globally
pnpm add -g @railway/cli netlify-cli

# Deploy backend to Railway
railway login
railway init
railway up

# Deploy frontend to Netlify  
cd apps/frontend
netlify login
netlify init
netlify deploy --prod
```
