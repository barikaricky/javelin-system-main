# Remaining Service File Conversions - COMPLETE GUIDE

## ✅ Already Converted (Working)
- ✅ auth.service.ts - COMPLETE
- ✅ activity.service.ts - COMPLETE
- ✅ director.service.ts - COMPLETE
- ✅ manager.service.ts - COMPLETE
- ✅ expense.service.ts - COMPLETE
- ✅ email.service.ts - NO CHANGES NEEDED (no database calls)

## 🔄 Remaining Files to Convert

### Critical Priority (Must Convert):
1. **supervisor.service.ts** (946 lines) - COMPLEX
   - Uses: User, Supervisor, Location models
   - Complex approval workflow
   - Many Prisma transactions
   
2. **notification.service.ts** (1024 lines) - MEDIUM
   - Uses: Notification, User models
   - Broadcast notifications
   
3. **director-onboarding.service.ts** (200 lines) - SIMPLE
   - Uses: User, Director models
   - Simple create operation

### Secondary Priority:
4. **meeting.service.ts** (1588 lines) - COMPLEX
   - Uses: Meeting, MeetingParticipant, Director models
   - Complex queries and aggregations

5. **poll.service.ts** (584 lines) - MEDIUM
   - Uses: Poll, PollOption, PollResponse models
   
6. **messaging.service.ts** (1120 lines) - COMPLEX
   - Uses: Conversation, ConversationParticipant, Message models
   
7. **registration-request.service.ts** (654 lines) - MEDIUM
   - Uses: RegistrationRequest, User models
   
8. **secretary.service.ts** (312 lines) - SIMPLE
   - Uses: User, Secretary models

## 📋 Conversion Checklist for Each File

### Step 1: Update Imports
```typescript
// REMOVE:
import { prisma } from '../utils/database';
import { UserRole, UserStatus, ... } from '@prisma/client';

// ADD:
import { User, Director, Manager, ... } from '../models';
```

### Step 2: Convert Queries

#### Find Operations
```typescript
// Prisma:
await prisma.user.findUnique({ where: { id } })
await prisma.user.findMany({ where: { status: 'ACTIVE' } })
await prisma.user.findFirst({ where: { email } })

// Mongoose:
await User.findById(id)
await User.find({ status: 'ACTIVE' })
await User.findOne({ email })
```

#### Create Operations
```typescript
// Prisma:
await prisma.user.create({
  data: { email, firstName, ... }
})

// Mongoose:
await User.create({
  email, firstName, ...
})
```

#### Update Operations
```typescript
// Prisma:
await prisma.user.update({
  where: { id },
  data: { status: 'ACTIVE' }
})

// Mongoose:
await User.findByIdAndUpdate(
  id,
  { status: 'ACTIVE' },
  { new: true }
)
```

#### Delete Operations
```typescript
// Prisma:
await prisma.user.delete({ where: { id } })

// Mongoose:
await User.findByIdAndDelete(id)
```

#### Count Operations
```typescript
// Prisma:
await prisma.user.count({ where: { role: 'MANAGER' } })

// Mongoose:
await User.countDocuments({ role: 'MANAGER' })
```

### Step 3: Convert Relationships (Include/Populate)

```typescript
// Prisma:
await prisma.manager.findMany({
  include: {
    users: { select: { email: true, firstName: true } },
    locations: true
  }
})

// Mongoose:
await Manager.find()
  .populate({
    path: 'userId',
    select: 'email firstName'
  })
  .populate('locationId')
```

### Step 4: Convert Transactions

```typescript
// Prisma:
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: ... });
  const manager = await tx.manager.create({ data: ... });
  return { user, manager };
});

// Mongoose (simple - no transactions needed for most cases):
const user = await User.create({ ... });
const manager = await Manager.create({ userId: user._id, ... });

// Mongoose (with transactions if needed):
const session = await mongoose.startSession();
session.startTransaction();
try {
  const user = await User.create([{ ... }], { session });
  const manager = await Manager.create([{ userId: user[0]._id, ... }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Step 5: Convert Enums

```typescript
// Prisma:
role: UserRole.MANAGER
status: UserStatus.ACTIVE
supervisorType: SupervisorType.GENERAL_SUPERVISOR

// Mongoose (string literals):
role: 'MANAGER'
status: 'ACTIVE'
supervisorType: 'GENERAL_SUPERVISOR'
```

### Step 6: Convert Aggregations

```typescript
// Prisma:
await prisma.expense.aggregate({
  where: { status: 'APPROVED' },
  _sum: { amount: true },
  _count: true
})

// Mongoose:
const result = await Expense.aggregate([
  { $match: { status: 'APPROVED' } },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  }
]);
const total = result[0] || { totalAmount: 0, count: 0 };
```

### Step 7: Convert Pagination

```typescript
// Prisma:
await prisma.user.findMany({
  where: filters,
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})

// Mongoose:
await User.find(filters)
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 })
```

### Step 8: Convert Date Filtering

```typescript
// Prisma:
where: {
  expenseDate: {
    gte: startDate,
    lte: endDate
  }
}

// Mongoose:
where: {
  expenseDate: {
    $gte: startDate,
    $lte: endDate
  }
}
```

## 🛠️ Quick Reference: Common Patterns

### Pattern 1: User Registration
```typescript
// Check if exists
const existing = await User.findOne({ email });
if (existing) throw new AppError('Email exists', 409);

// Create user
const user = await User.create({
  email,
  passwordHash: await bcrypt.hash(password, 10),
  role: 'MANAGER',
  status: 'ACTIVE'
});

// Create related record
const manager = await Manager.create({
  userId: user._id,
  employeeId: generatedId
});
```

### Pattern 2: Get with Relations
```typescript
const managers = await Manager.find()
  .populate({
    path: 'userId',
    select: 'email firstName lastName'
  })
  .populate('locationId')
  .sort({ createdAt: -1 });
```

### Pattern 3: Update
```typescript
const updated = await User.findByIdAndUpdate(
  id,
  { $set: { status: 'ACTIVE', lastLogin: new Date() } },
  { new: true, runValidators: true }
);
```

### Pattern 4: Soft Delete / Status Change
```typescript
await User.findByIdAndUpdate(id, { status: 'INACTIVE' });
```

### Pattern 5: Search/Filter
```typescript
const where: any = {};
if (email) where.email = new RegExp(email, 'i'); // Case-insensitive
if (status) where.status = status;
if (role) where.role = role;

const users = await User.find(where);
```

##Actions Needed

1. **Convert director-onboarding.service.ts** (EASIEST - start here)
2. **Convert secretary.service.ts** (SIMPLE)
3. **Convert notification.service.ts** (MEDIUM - important for app flow)
4. **Convert supervisor.service.ts** (COMPLEX - core functionality)
5. **Convert poll.service.ts** (MEDIUM)
6. **Convert registration-request.service.ts** (MEDIUM)
7. **Convert meeting.service.ts** (COMPLEX - can be done last)
8. **Convert messaging.service.ts** (COMPLEX - can be done last)

## ⚠️ After Converting All Services

1. **Remove Prisma completely**:
   ```bash
   cd apps/backend
   pnpm remove @prisma/client prisma
   rm -rf prisma/
   ```

2. **Update route files** - Remove Prisma enum imports:
   - apps/backend/src/routes/*.routes.ts
   - Replace `@prisma/client` enum imports with string literals or local enums

3. **Test each endpoint** systematically

4. **Update .env.example** to remove PostgreSQL references

5. **Update docker-compose.yml** to remove postgres and redis services

## 📝 Notes

- MongoDB uses `_id` instead of `id` - handle this in responses
- Mongoose returns Mongoose Documents, not plain objects - use `.toObject()` or `.lean()` if needed
- Populate is asynchronous and must use `await`
- MongoDB operators use `$` prefix: `$gte`, `$lte`, `$in`, `$ne`, etc.
- Transactions are optional in MongoDB for single-document operations

---

This guide provides all patterns needed to convert any Prisma service to Mongoose.
