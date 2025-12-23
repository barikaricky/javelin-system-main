# 🚀 Quick Start Checklist

Follow this checklist to get your project running with MongoDB locally.

## ✅ Pre-Migration (Already Done)

- [x] MongoDB installed on Windows
- [x] Node.js installed
- [x] All Mongoose models created (25 models)
- [x] Database connection configured
- [x] Environment variables updated
- [x] Frontend configuration fixed
- [x] Documentation created

## 📋 Your To-Do List

### Step 1: Install Dependencies
```bash
cd apps/backend
pnpm install
```
- [ ] No errors during installation
- [ ] `mongoose` appears in `node_modules`

### Step 2: Start MongoDB
```bash
# Windows Command Prompt (as Administrator)
net start MongoDB
```
- [ ] Service starts successfully
- [ ] Can connect with `mongosh`
- [ ] Database `jevelin` created (will autocreate on first use)

### Step 3: Start Backend
```bash
cd apps/backend
pnpm dev
```
- [ ] Server starts on port 3001
- [ ] See "✅ Database connected successfully"
- [ ] No Prisma errors
- [ ] Health endpoint works: `http://localhost:3001/api/health`

**If you see Prisma errors:**
- These are from service files not yet updated
- Check `MIGRATION-STATUS.md` for the file list
- Comment out problematic routes temporarily OR update the service file

### Step 4: Create Initial Data
You need at least one user to log in. Choose one:

**Option A: Using mongosh**
```javascript
use jevelin

// Create a director user (password: admin123)
db.users.insertOne({
  email: "director@jevelin.com",
  firstName: "Admin",
  lastName: "Director",
  passwordHash: "$2a$10$rXQvDkpm7qZY5qV5qZ5qZOqZY5qV5qZ5qZY5qV5qZ5qZY5qV5qZ5q",
  role: "DIRECTOR",
  status: "ACTIVE",
  nationality: "Nigerian",
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get the user ID from the output
// Then create director profile:
db.directors.insertOne({
  userId: ObjectId("USER_ID_FROM_ABOVE"),
  employeeId: "DIR001",
  startDate: new Date()
})
```

**Option B: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Create database `jevelin`
4. Create collection `users`
5. Insert document with fields above
6. Create collection `directors`
7. Insert director document

**Option C: Use the register endpoint** (if working)
```bash
POST http://localhost:3001/api/auth/register
{
  "email": "director@jevelin.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "Director",
  "role": "DIRECTOR"
}
```

- [ ] At least one user created
- [ ] Can query: `db.users.find({})`

### Step 5: Start Frontend
```bash
cd apps/frontend
pnpm install  # If not done already
pnpm dev
```
- [ ] Frontend starts on port 3000
- [ ] Opens in browser
- [ ] Login page loads

### Step 6: Test Login
1. Go to `http://localhost:3000`
2. Enter credentials:
   - Email: `director@jevelin.com`
   - Password: `admin123` (or what you set)
3. Click Login

- [ ] Login successful
- [ ] Redirects to dashboard
- [ ] No console errors

## ⚠️ Troubleshooting

### "Cannot find module '@prisma/client'"
✅ **Fixed**: Run `pnpm install` in `apps/backend`

### "connect ECONNREFUSED 127.0.0.1:27017"
✅ **Fix**: Start MongoDB
```cmd
net start MongoDB
```

### "Prisma Client not initialized"  
✅ **Fix**: Some service files still use Prisma
- Check which endpoint caused the error
- Find the service file in `MIGRATION-STATUS.md`
- Either:
  - Update the service file (use `CONVERSION-REFERENCE.ts`)
  - Or comment out that route temporarily

### "Module not found: Error: Can't resolve 'mongoose'"
✅ **Fix**: 
```bash
cd apps/backend
pnpm add mongoose
```

### Login fails with 401
✅ **Check**:
- User exists in database: `db.users.findOne({ email: "director@jevelin.com" })`
- Password hash is correct
- User status is "ACTIVE"
- User role is set

### Port 3001 in use
✅ **Fix**: The server auto-finds next available port, or:
```bash
# Change PORT in .env
PORT=3002
```

## 🎯 Success Criteria

Your migration is successful when:
- [ ] Backend starts without Prisma errors
- [ ] MongoDB connection established
- [ ] Can login with test user
- [ ] Dashboard loads (even if some features don't work)
- [ ] `/api/health` returns OK
- [ ] No critical console errors

## 📝 Next Steps After Basic Setup

Once the above is working:

1. **Update remaining service files** (one at a time):
   - See `MIGRATION-STATUS.md` for list
   - Use `CONVERSION-REFERENCE.ts` for patterns
   - Test each file after updating

2. **Seed more data**:
   - Locations
   - Managers
   - Supervisors
   - Operators

3. **Test all features**:
   - Create expenses
   - Schedule meetings
   - Create polls
   - Send messages

4. **Optional - Remove old files**:
   ```bash
   # After everything works
   cd apps/backend
   rm -rf prisma/
   rm docker-compose.yml
   ```

## 📚 Reference Documents

- **Setup**: See `MONGODB-SETUP.md`
- **Quick Ref**: See `QUICK-START.md`
- **Conversions**: See `apps/backend/CONVERSION-REFERENCE.ts`
- **Status**: See `MIGRATION-STATUS.md`
- **Summary**: See `MIGRATION-SUMMARY.md`

---

**Expected Time**: 15-30 minutes to get basic system running
**Current Progress**: 40% complete (infrastructure + 2 core services)
**Remaining**: Update 11 service files (4-6 hours estimated)

Good luck! 🚀
