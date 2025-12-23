# MongoDB Local Setup Guide

## Overview
This project has been migrated from PostgreSQL (with Prisma ORM) to MongoDB (with Mongoose ODM) for local development without Docker.

## Prerequisites

### 1. Install MongoDB on Windows

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. Optionally install MongoDB Compass (GUI tool)

### 2. Verify MongoDB Installation

Open Command Prompt or PowerShell and run:
```bash
mongod --version
```

You should see MongoDB version information.

### 3. Start MongoDB Service

MongoDB should auto-start as a Windows service. If not, start it manually:

**Using Windows Services:**
1. Press `Win + R`, type `services.msc`
2. Find "MongoDB Server" in the list
3. Right-click and select "Start"

**OR using Command Prompt (as Administrator):**
```bash
net start MongoDB
```

### 4. Verify MongoDB is Running

```bash
mongosh
```

This should connect you to the MongoDB shell. Type `exit` to quit.

## Project Setup

### 1. Install Dependencies

From the project root:
```bash
cd apps/backend
pnpm install
```

This will install:
- `mongoose` - MongoDB ODM
- All other existing dependencies (Express, JWT, etc.)
- Removed: `@prisma/client`, `prisma`, `redis`

### 2. Environment Configuration

Your `.env` file has been updated with MongoDB connection string:

```env
DATABASE_URL="mongodb://localhost:27017/jevelin_db"
PORT=3001
JWT_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@jevelin.com
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Important:** Make sure to update `JWT_SECRET` and email settings before production use.

### 3. Database Models

All Prisma schemas have been converted to Mongoose models in:
```
apps/backend/src/models/
├── User.model.ts
├── Director.model.ts
├── Manager.model.ts
├── Supervisor.model.ts
├── Operator.model.ts
├── Secretary.model.ts
├── Location.model.ts
├── Notification.model.ts
├── Expense.model.ts
├── Shift.model.ts
├── Attendance.model.ts
├── AuditLog.model.ts
├── IncidentReport.model.ts
├── PayrollRecord.model.ts
├── RegistrationRequest.model.ts
├── Meeting.model.ts
├── MeetingParticipant.model.ts
├── Poll.model.ts
├── PollOption.model.ts
├── PollResponse.model.ts
├── Conversation.model.ts
├── ConversationParticipant.model.ts
├── Message.model.ts
├── BroadcastMessage.model.ts
├── BroadcastReceipt.model.ts
└── index.ts
```

## Running the Application

### Start the Backend

From `apps/backend` directory:
```bash
pnpm dev
```

The server will start on `http://localhost:3001`

### Start the Frontend

From `apps/frontend` directory:
```bash
pnpm dev
```

The frontend will start on `http://localhost:3000`

## MongoDB Management

### Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You'll see your `jevelin_db` database with all collections

### Using MongoDB Shell (CLI)

```bash
mongosh
use jevelin_db
show collections
db.users.find().pretty()
```

## Migration Notes

### What Changed:

1. **Database:** PostgreSQL → MongoDB
2. **ORM:** Prisma → Mongoose
3. **Connection:** Updated `apps/backend/src/lib/prisma.ts` to use Mongoose
4. **Models:** All 25+ models converted to Mongoose schemas
5. **Docker:** Removed Docker dependencies (optional for local dev)
6. **Redis:** Removed (can be re-added if needed for caching)

### What Needs Updating (Next Steps):

⚠️ **Important:** All services and controllers that use Prisma queries need to be updated to use Mongoose syntax.

**Files that need updating:**
- All `*.service.ts` files in `apps/backend/src/services/`
- All `*.controller.ts` files in `apps/backend/src/controllers/`
- Any middleware using Prisma

**Example conversion:**

**Before (Prisma):**
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { director: true }
});
```

**After (Mongoose):**
```typescript
import { User } from '../models';

const user = await User.findOne({ email: 'user@example.com' })
  .populate('director')
  .exec();
```

## Common MongoDB Commands

### Create a new document
```javascript
db.users.insertOne({
  email: "admin@jevelin.com",
  firstName: "Admin",
  lastName: "User",
  role: "DIRECTOR",
  status: "ACTIVE"
})
```

### Find documents
```javascript
db.users.find({ role: "DIRECTOR" })
db.users.findOne({ email: "admin@jevelin.com" })
```

### Update document
```javascript
db.users.updateOne(
  { email: "admin@jevelin.com" },
  { $set: { status: "ACTIVE" } }
)
```

### Delete document
```javascript
db.users.deleteOne({ email: "user@example.com" })
```

### Drop entire database (CAUTION!)
```javascript
use jevelin_db
db.dropDatabase()
```

## Troubleshooting

### MongoDB not starting
1. Check Windows Services for "MongoDB Server"
2. Check MongoDB logs at: `C:\Program Files\MongoDB\Server\<version>\log\`
3. Restart the service: `net stop MongoDB && net start MongoDB`

### Connection refused error
- Verify MongoDB is running: `mongosh` should connect
- Check firewall settings
- Verify DATABASE_URL in `.env`

### Port 3001 already in use
- The server will automatically try the next available port
- Or manually change PORT in `.env`

### Models not found
- Make sure you've run `pnpm install` in `apps/backend`
- Check that all model files are properly exported in `apps/backend/src/models/index.ts`

## Database Seeding

You'll need to create seed data manually or write a seeding script. Example:

Create `apps/backend/src/scripts/seed-mongodb.ts`:
```typescript
import { connectDB } from '../lib/prisma';
import { User, Director } from '../models';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDB();
  
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await User.create({
    email: 'admin@jevelin.com',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash,
    role: 'DIRECTOR',
    status: 'ACTIVE',
    employeeId: 'DIR001',
  });
  
  // Create director profile
  await Director.create({
    userId: user._id,
    employeeId: 'DIR001',
  });
  
  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seed();
```

Run with: `tsx apps/backend/src/scripts/seed-mongodb.ts`

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ Mongoose models created
3. ✅ Database connection updated
4. ✅ Environment variables configured
5. ⚠️ **TODO:** Update all service files to use Mongoose instead of Prisma
6. ⚠️ **TODO:** Test all API endpoints
7. ⚠️ **TODO:** Create database seeding script

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [MongoDB Shell (mongosh)](https://www.mongodb.com/docs/mongodb-shell/)

---

**Note:** This migration requires updating all database queries in your services and controllers. The models are ready, but query syntax must be converted from Prisma to Mongoose.
