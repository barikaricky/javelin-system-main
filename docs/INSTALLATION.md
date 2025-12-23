# Installation & Setup Commands

## Backend Setup

```bash
# Navigate to backend
cd apps/backend

# Remove old dependencies  
pnpm remove @prisma/client prisma redis

# Install mongoose (should already be in package.json)
pnpm install

# Build to check for TypeScript errors
pnpm build
```

## Start MongoDB

### On Windows:
```cmd
# Start MongoDB service
net start MongoDB

# Or check if it's running
mongosh
```

### Verify Connection:
```bash
# In mongosh
show dbs
use jevelin
```

## Start the Application

### Terminal 1 - Backend:
```bash
cd apps/backend
pnpm dev
```

### Terminal 2 - Frontend:
```bash
cd apps/frontend  
pnpm dev
```

## Current Status

### ✅ What's Working:
- MongoDB connection configured
- All 25 Mongoose models created
- Auth service updated (login/register)
- Activity logging updated
- Environment variables configured

### ⚠️ What Needs Work:
- 9+ service files still use Prisma syntax
- These will cause errors when endpoints are called
- See [MIGRATION-STATUS.md](./MIGRATION-STATUS.md) for details

## Quick Test

After starting the backend, test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T...",
  "environment": "development"
}
```

## Troubleshooting

### "Cannot find module '@prisma/client'"
- Run: `pnpm install` in apps/backend
- The package.json has been updated

### "connect ECONNREFUSED 127.0.0.1:27017"
- MongoDB is not running
- Start it: `net start MongoDB`

### TypeScript errors about Prisma
- Some service files haven't been updated yet
- See MIGRATION-STATUS.md for the list
- You can comment out routes temporarily to test

### "Module not found: mongoose"
- Run: `cd apps/backend && pnpm install mongoose`

## Frontend Notes

The frontend should work fine as-is. It communicates with the backend via REST APIs, so as long as the backend endpoints return the same JSON structure, no frontend changes are needed.

The frontend is already configured to use `http://localhost:3001` as the API base URL (check `apps/frontend/src/lib/api.ts`).

## Next Steps

1. Run `cd apps/backend && pnpm install`
2. Start MongoDB: `net start MongoDB`
3. Start backend: `cd apps/backend && pnpm dev`
4. Fix any errors that appear (likely from non-updated service files)
5. Gradually update remaining service files using patterns in [CONVERSION-REFERENCE.ts](./CONVERSION-REFERENCE.ts)

## Database Seeding

Since this is a fresh MongoDB instance, you'll need to create initial data. Create a seed script or use MongoDB Compass to manually add:

1. A director user for login
2. Basic locations (if needed)
3. System settings

Example using mongosh:
```javascript
use jevelin

db.users.insertOne({
  email: "director@jevelin.com",
  firstName: "Director",
  lastName: "Admin",
  passwordHash: "$2a$10$...", // Use bcrypt to hash "admin123"
  role: "DIRECTOR",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Then create a corresponding director record linking to that user.
