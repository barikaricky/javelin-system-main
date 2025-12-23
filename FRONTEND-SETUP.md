# 🚀 Frontend Setup & Configuration

## The Issue:
Frontend shows 404 errors and empty screens because it can't reach the backend API.

## ✅ Fix Steps:

### 1. Make Sure Backend is Running

**On Railway (Production):**
- Go to: https://railway.app
- Check backend service is **Active**
- Test: https://jevelinbackend-production.up.railway.app/api/health
- Should return: `{"status":"ok",...}`

**Locally (Development):**
```bash
cd apps/backend
pnpm dev
```
- Backend should start on port 3002
- Test: http://localhost:3002/api/health

### 2. Start Frontend

**Easy way:**
```bash
bash start-frontend.sh
```

**Manual way:**
```bash
cd apps/frontend
rm -rf node_modules/.vite dist  # Clear cache
pnpm install                     # Install dependencies
pnpm dev                         # Start dev server
```

### 3. Access the Application

**Local Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3002
- Login with your director credentials

**Production:**
- Frontend: https://javelinadmin.netlify.app
- Backend: https://jevelinbackend-production.up.railway.app
- Make sure VITE_API_URL is set in Netlify

---

## 🐛 Troubleshooting

### "Failed to refresh user profile" (404)

**Problem:** Your stored auth token points to a user that doesn't exist in the database.

**Fix:**
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete: `token` and `jevelin-auth`
4. Refresh page
5. Log in again

**Or simply:** Click logout and login again.

### "Failed to load resource: 404"

**Check these:**

1. **Is backend running?**
   ```bash
   curl http://localhost:3002/api/health
   ```
   Should return 200 OK

2. **Is frontend using correct API URL?**
   - Check browser console for: `🌐 API Configuration`
   - Local dev should show: `baseURL: "http://localhost:3002/api"`
   - Production should show: `baseURL: "https://jevelinbackend-production.up.railway.app/api"`

3. **Clear browser cache:**
   - Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - Or clear site data in DevTools

### Vite Config Error

If you see: `failed to load config from vite.config.js`

**Fix:**
```bash
cd apps/frontend
rm -rf node_modules/.vite
rm -rf node_modules
pnpm install
pnpm dev
```

---

## 📝 Environment Variables

### Local (.env file)
```env
VITE_API_URL=http://localhost:3002/api
VITE_SERVER_URL=http://localhost:3002
VITE_APP_NAME="Javelin Management System"
```

### Production (Netlify)
Set in Netlify Dashboard → Site Settings → Environment variables:
```
VITE_API_URL=https://jevelinbackend-production.up.railway.app/api
```

---

## ✅ Checklist

- [ ] Backend is running (test /api/health endpoint)
- [ ] Frontend dependencies installed (`pnpm install`)
- [ ] Vite cache cleared (delete `node_modules/.vite`)
- [ ] Browser cache cleared (hard refresh)
- [ ] Auth tokens cleared (delete localStorage keys)
- [ ] Logged in with valid credentials
- [ ] Can see data in dashboard

---

## 🎯 Quick Test

After starting both servers:

1. Open: http://localhost:5173
2. Go to: /dev (developer onboarding page)
3. Register director with token: `JVL-2025-PROD-SECURE-d8f7a9b2c4e6f1h3`
4. Save credentials
5. Go to: /login
6. Login with director credentials
7. Should see dashboard with data

---

**Still having issues?** Check the browser console (F12) for detailed error messages!
