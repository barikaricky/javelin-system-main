# Quick Start Guide - MongoDB Migration

## ✅ Completed Steps

1. ✅ Created 25+ Mongoose models in `apps/backend/src/models/`
2. ✅ Updated database connection to use MongoDB
3. ✅ Updated `.env` file with MongoDB connection string
4. ✅ Removed Docker/Prisma/Redis from package.json

## 🔧 Manual Steps Required

### 1. Install Dependencies

Run these commands in the `apps/backend` directory:

```bash
# Remove old dependencies
pnpm remove @prisma/client prisma redis

# Install mongoose
pnpm add mongoose

# Install mongoose types (if needed)
pnpm add -D @types/mongoose
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB service is running
mongosh

# If not, start MongoDB service
net start MongoDB
```

### 3. Start the Application

```bash
# From apps/backend
pnpm dev
```

## ⚠️ Important Next Steps

### All Service Files Need Updating

Every file in `apps/backend/src/services/` that uses Prisma queries must be converted to Mongoose.

**Example Conversion:**

**OLD (Prisma):**
```typescript
import { prisma } from '../lib/prisma';

const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }
});
```

**NEW (Mongoose):**
```typescript
import { User } from '../models';

const user = await User.create({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
});
```

### Files That Need Updating:

📝 **Services** (`apps/backend/src/services/`):
- auth.service.ts
- director.service.ts
- supervisor.service.ts
- operator.service.ts
- manager.service.ts
- secretary.service.ts
- expense.service.ts
- meeting.service.ts
- notification.service.ts
- poll.service.ts
- messaging.service.ts
- All other *.service.ts files

📝 **Controllers** (`apps/backend/src/controllers/`):
- director.controller.ts
- All other *.controller.ts files

📝 **Middlewares** (if they use database):
- auth.middleware.ts

## Common Query Conversions

### Find One
```typescript
// Prisma
await prisma.user.findUnique({ where: { email } });

// Mongoose  
await User.findOne({ email });
```

### Find Many
```typescript
// Prisma
await prisma.user.findMany({ where: { role: 'DIRECTOR' } });

// Mongoose
await User.find({ role: 'DIRECTOR' });
```

### Create
```typescript
// Prisma
await prisma.user.create({ data: { ...userData } });

// Mongoose
await User.create({ ...userData });
```

### Update
```typescript
// Prisma
await prisma.user.update({
  where: { id },
  data: { status: 'ACTIVE' }
});

// Mongoose
await User.findByIdAndUpdate(id, { status: 'ACTIVE' }, { new: true });
```

### Delete
```typescript
// Prisma
await prisma.user.delete({ where: { id } });

// Mongoose
await User.findByIdAndDelete(id);
```

### Relations (Populate)
```typescript
// Prisma
await prisma.user.findUnique({
  where: { id },
  include: { director: true }
});

// Mongoose
await User.findById(id).populate('director');
```

## Testing

After making changes:

1. Start MongoDB: `net start MongoDB`
2. Run backend: `pnpm dev` (in apps/backend)
3. Test API endpoints
4. Check MongoDB Compass for data

## Need Help?

- See [MONGODB-SETUP.md](./MONGODB-SETUP.md) for detailed instructions
- MongoDB Docs: https://mongoosejs.com/docs/
- Your models are in: `apps/backend/src/models/`

---

**Status:** Models are ready, but you need to update ~30+ service files to use Mongoose instead of Prisma.
