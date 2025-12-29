# ✅ Render Deployment Checklist

## Pre-Deployment
- [ ] GitHub repository is up to date
- [ ] MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- [ ] Have all environment variables ready (see RENDER-ENV-VARS.md)

---

## Render Backend Setup
- [ ] Created Render account (https://render.com)
- [ ] Connected GitHub repository
- [ ] Created new Web Service
- [ ] Set service name: `javelin-backend`
- [ ] Set root directory: `apps/backend`
- [ ] Set build command: `corepack enable && pnpm install`
- [ ] Set start command: `pnpm start`
- [ ] Selected FREE plan
- [ ] Added DATABASE_URL variable
- [ ] Added NODE_ENV=production variable
- [ ] Added PORT=3002 variable
- [ ] Added JWT_SECRET variable
- [ ] Added JWT_REFRESH_SECRET variable
- [ ] Added JWT_EXPIRES_IN=7d variable
- [ ] Added JWT_REFRESH_EXPIRES_IN=30d variable
- [ ] Added ENCRYPTION_KEY variable
- [ ] Added DEVELOPER_ONBOARDING_TOKEN variable
- [ ] Added FRONTEND_URL=https://javelinadmin.netlify.app variable
- [ ] Added CORS_ORIGIN=https://javelinadmin.netlify.app variable
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment (3-5 minutes)
- [ ] Backend status shows "Live"
- [ ] Copied backend URL: `https://javelin-backend.onrender.com`

---

## Netlify Frontend Update
- [ ] Opened Netlify dashboard (https://app.netlify.com)
- [ ] Clicked on javelin site
- [ ] Went to Site configuration → Environment variables
- [ ] Updated/Added VITE_API_URL=https://javelin-backend.onrender.com/api
- [ ] Went to Deploys tab
- [ ] Clicked "Trigger deploy"
- [ ] Selected "Clear cache and deploy site"
- [ ] Waited for deployment (2-3 minutes)
- [ ] Frontend deployment successful

---

## Testing
- [ ] Backend health check works: https://javelin-backend.onrender.com/api/health
- [ ] Frontend loads: https://javelinadmin.netlify.app
- [ ] Login page displays correctly
- [ ] Can login as Director
- [ ] Can login as Manager
- [ ] Can login as Secretary
- [ ] Operator registration works (Director)
- [ ] Operator registration works (Manager)
- [ ] Operator registration works (Secretary)
- [ ] Dashboard loads data correctly
- [ ] No CORS errors in browser console
- [ ] Photos/images upload correctly
- [ ] All API endpoints responding

---

## Post-Deployment
- [ ] Monitored logs for errors (Render → Logs tab)
- [ ] Confirmed no 500 errors
- [ ] Confirmed no connection errors
- [ ] Tested guarantor validation (all 3 forms)
- [ ] Tested salary fields
- [ ] Tested state/LGA dropdowns
- [ ] All features working as expected

---

## Cleanup (Optional)
- [ ] Verified everything works for 24 hours
- [ ] Deleted Railway service (if applicable)
- [ ] Cancelled Railway subscription
- [ ] Updated team about new URLs
- [ ] Updated any external documentation

---

## 📝 Notes

**Backend URL:** https://javelin-backend.onrender.com  
**Frontend URL:** https://javelinadmin.netlify.app  
**Deployment Date:** _____________  
**Deployed By:** _____________  

**Issues Encountered:**
- _____________________________________________
- _____________________________________________
- _____________________________________________

**Resolution:**
- _____________________________________________
- _____________________________________________
- _____________________________________________

---

## 🎉 Success!

- [ ] **All checkboxes above are completed**
- [ ] **System is fully operational**
- [ ] **Saving $5-20/month on hosting costs**

---

**Status:** [ ] In Progress  [ ] Complete  [ ] Issues Found

**Overall Time:** ______ minutes
