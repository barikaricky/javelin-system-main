# DEVELOPER SETUP - How to Onboard the Managing Director

## Overview
This system has a **3-tier onboarding flow**:
1. **Developer** → Creates the **Managing Director** account
2. **Managing Director** → Logs in and manages the organization
3. **Managing Director** → Creates accounts for Managers, Supervisors, Operators, etc.

## Step 1: Start MongoDB
```bash
# On Windows
net start MongoDB

# Verify it's running
mongosh
# You should see MongoDB shell
```

## Step 2: Start Backend Server
```bash
cd apps/backend
pnpm dev
```

You should see:
```
✅ Database connected successfully
🚀 Server is running on port 3002
🔗 API URL: http://localhost:3002
```

## Step 3: Create the Managing Director Account

### Option A: Using the Developer Onboarding Page (Recommended)

**URL:** `http://localhost:3000/dev/onboarding`

1. Make sure both backend and frontend are running
2. Open your browser and navigate to: `http://localhost:3000/dev/onboarding`
3. Fill in the form:
   - **Developer Token:** `DEV-JEVELIN-2025-SECURE-TOKEN` (from your .env file)
   - **Email:** director@jevelin.com
   - **First Name:** John
   - **Last Name:** Doe
   - **Phone:** +234-123-456-7890 (optional)
4. Click "Initialize Director Account"
5. Save the credentials that appear on screen (shown only once!)

### Option B: Using curl (Command Line)
```bash
curl -X POST http://localhost:3002/api/onboarding/director \
  -H "Content-Type: application/json" \
  -d "{
    \"developerToken\": \"DEV-JEVELIN-2025-SECURE-TOKEN\",
    \"email\": \"director@jevelin.com\",
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"phone\": \"+234-123-456-7890\"
  }"
```

### Option C: Using Postman or Thunder Client

**Endpoint:** `POST http://localhost:3002/api/onboarding/director`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "developerToken": "DEV-JEVELIN-2025-SECURE-TOKEN",
  "email": "director@jevelin.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+234-123-456-7890"
}
```

### Response - SAVE THIS!
```json
{
  "success": true,
  "message": "Director account created successfully",
  "data": {
    "user": {
      "id": "676166a4f8b9c2d3e4f5a6b7",
      "email": "director@jevelin.com",
      "role": "DIRECTOR",
      "employeeId": "DIR-123456-789"
    },
    "temporaryPassword": "aB3$xY9#mK2@pL5^"
  }
}
```

**⚠️ IMPORTANT:** 
- The `temporaryPassword` is **shown only once**
- Save it immediately
- Give it to the Managing Director

## Step 4: Managing Director Logs In

The Managing Director can now login using:
- **Employee ID:** `DIR-123456-789` (or email)
- **Password:** The temporary password you saved

### Login Endpoint
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"director@jevelin.com\",
    \"password\": \"aB3$xY9#mK2@pL5^\"
  }"
```

### Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "676166a4f8b9c2d3e4f5a6b7",
    "email": "director@jevelin.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DIRECTOR",
    "phone": "+234-123-456-7890",
    "profilePhoto": null
  }
}
```

## Step 5: Start Frontend (Optional)
```bash
cd apps/frontend
pnpm dev
```

Frontend runs on: `http://localhost:3000`

## How Login Works - Single Portal for All Roles

### Login Flow:
1. User visits `http://localhost:3000`
2. Sees **one login page** (email/password)
3. Enters credentials
4. Backend checks their **role** in database
5. Returns user data with role
6. Frontend redirects to appropriate dashboard:
   - `DIRECTOR` → Director Dashboard
   - `MANAGER` → Manager Dashboard  
   - `SUPERVISOR` → Supervisor Dashboard
   - `OPERATOR` → Operator Dashboard
   - `SECRETARY` → Secretary Dashboard

### Example Login Response:
```json
{
  "user": {
    "role": "DIRECTOR",  ← Frontend checks this
    "email": "director@jevelin.com",
    "firstName": "John"
  }
}
```

## Security Notes

### Developer Token
- Located in `.env` file: `DEVELOPER_ONBOARDING_TOKEN`
- Default: `DEV-JEVELIN-2025-SECURE-TOKEN`
- **Change this in production!**
- Generate secure token: `openssl rand -base64 32`

### Only ONE Director Allowed
- The system prevents creating multiple directors
- If you try to create a second director:
  ```json
  {
    "error": "A director account already exists in the system"
  }
  ```

## Troubleshooting

### "Invalid developer token"
- Check your `.env` file
- Make sure `DEVELOPER_ONBOARDING_TOKEN` matches what you're sending

### "Cannot find module '@prisma/client'"
- Run: `cd apps/backend && pnpm install`

### "connect ECONNREFUSED 127.0.0.1:27017"
- MongoDB is not running
- Start it: `net start MongoDB`

### "User not found" during login
- Make sure you created the director account first
- Check MongoDB: `mongosh` → `use jevelin` → `db.users.find()`

## Database Verification

Check if director was created:
```bash
mongosh
use jevelin
db.users.findOne({ role: "DIRECTOR" })
db.directors.findOne()
```

## What Happens After Director Logs In?

Once logged in, the Managing Director can:
1. Create **Manager** accounts
2. Create **Supervisor** accounts (via managers)
3. Create **Operator** accounts
4. Create **Secretary** accounts
5. View expenses, meetings, polls
6. Manage locations and departments

## Next Steps

1. ✅ Create director account (you just did this)
2. ✅ Director logs in
3. Director creates other user accounts
4. Other users log in with their credentials
5. Each user sees their role-specific dashboard

## API Endpoints Summary

| Endpoint | Method | Purpose | Who Uses It |
|----------|--------|---------|-------------|
| `/api/onboarding/director` | POST | Create first director | Developer |
| `/api/auth/login` | POST | Login for all users | Everyone |
| `/api/auth/me` | GET | Get current user | Frontend |
| `/api/director/*` | Various | Director operations | Director |
| `/api/managers/*` | Various | Manager operations | Director/Manager |

---

**You're all set! 🚀**

The system is configured as a MERN stack with:
- ✅ MongoDB for database
- ✅ Express.js backend (TypeScript)
- ✅ React frontend
- ✅ Node.js runtime
- ✅ Single login page with role-based routing
