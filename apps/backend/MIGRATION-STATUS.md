# Backend Migration Status - Prisma to Mongoose

## ✅ Completed Files

### Core Infrastructure
- ✅ `src/lib/prisma.ts` - Updated to use Mongoose connection
- ✅ `src/utils/database.ts` - Updated initialization
- ✅ `src/models/` - All 25 Mongoose models created

### Services (Partially Complete)
- ✅ `src/services/auth.service.ts` - UPDATED
- ✅ `src/services/activity.service.ts` - UPDATED

## ⚠️ Files That Still Need Updating

### High Priority Services (Core Functionality)
These files contain Prisma queries and MUST be updated before the backend will work:

1. **src/services/director.service.ts** - Lines 2-167
   - Remove: `import { prisma } from '../utils/database'`
   - Add: `import { User, Director, Supervisor } from '../models'`
   - Update all `prisma.*` calls to Mongoose

2. **src/services/manager.service.ts** - Multiple Prisma calls
   - Update transaction syntax
   - Convert all findMany/findUnique to Mongoose

3. **src/services/supervisor.service.ts** - Prisma imports and queries
4. **src/services/expense.service.ts** - ~30 Prisma queries
5. **src/services/notification.service.ts** - ~25 Prisma queries
6. **src/services/meeting.service.ts** - Prisma and Mux integration
7. **src/services/poll.service.ts** - Poll operations
8. **src/services/messaging.service.ts** - Message operations
9. **src/services/registration-request.service.ts** - Registration handling
10. **src/services/secretary.service.ts** - Secretary operations
11. **src/services/director-onboarding.service.ts** - Director setup

### Middleware Files
12. **src/middlewares/errorHandler.ts** - Remove Prisma import

### Route Files (Low Priority - mostly just imports)
These files import Prisma enums but don't use Prisma queries:
13. **src/routes/operator.routes.ts** - Change enum imports
14. **src/routes/registration-request.routes.ts** - Change enum imports
15. **src/routes/general-supervisor.routes.ts** - Change enum imports

## 🔧 Quick Fix Instructions

### For Service Files Pattern:

**STEP 1:** Update imports
```typescript
// OLD
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../utils/database';

// NEW  
import { User, UserRole, UserStatus } from '../models';
```

**STEP 2:** Update queries

| Prisma | Mongoose |
|--------|----------|
| `prisma.user.findUnique({ where: { id } })` | `User.findById(id)` |
| `prisma.user.findMany({ where })` | `User.find(where)` |
| `prisma.user.create({ data })` | `User.create(data)` |
| `prisma.user.update({ where: { id }, data })` | `User.findByIdAndUpdate(id, data, { new: true })` |
| `prisma.user.delete({ where: { id } })` | `User.findByIdAndDelete(id)` |
| `prisma.user.count({ where })` | `User.countDocuments(where)` |

**STEP 3:** Update transactions
```typescript
// OLD (Prisma)
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.director.create({ data: { userId: user.id } });
});

// NEW (Mongoose)
import mongoose from 'mongoose';

const session = await mongoose.startSession();
session.startTransaction();
try {
  const user = await User.create([userData], { session });
  await Director.create([{ userId: user[0]._id }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**STEP 4:** Update ID references
```typescript
// Prisma uses string IDs
user.id

// Mongoose uses ObjectId (but can be converted to string)
user._id.toString()
```

**STEP 5:** Update relations/includes
```typescript
// OLD (Prisma)
await prisma.user.findUnique({
  where: { id },
  include: { director: true, managers: true }
});

// NEW (Mongoose)
await User.findById(id)
  .populate('director')
  .populate('managers')
  .exec();
```

## 📋 Detailed File-by-File TODOs

### src/services/director.service.ts
- Line 2: Change imports
- Lines 48-167: Update all `prisma.$transaction` calls
- Update `prisma.user.findUnique` → `User.findOne`
- Update `prisma.user.create` → `User.create`
- Update `prisma.supervisors.create` → `Supervisor.create`

### src/services/manager.service.ts  
- Line 2: Change imports
- Line 22: `prisma.managers.count()` → `Manager.countDocuments()`
- Line 51: `prisma.user.findUnique` → `User.findOne`
- Line 68: Update transaction syntax
- Line 154: `prisma.user.findUnique` → `User.findOne`
- Line 162: `prisma.locations.findMany` → `Location.find`
- Line 176: `prisma.managers.findUnique` → `Manager.findOne`
- Line 222: `prisma.managers.findMany` → `Manager.find`

### src/services/expense.service.ts
- Update all `prisma.expense.*` → `Expense.*`
- Update all `prisma.location.*` → `Location.*`
- Convert aggregation queries to Mongoose aggregation pipeline
- Update groupBy operations to use $group in aggregation

### src/services/notification.service.ts
- Update all `prisma.notifications.*` → `Notification.*`
- Update all `prisma.user.*` → `User.*`
- Update meeting_participants references

### src/services/meeting.service.ts
- Update all `prisma.meetings.*` → `Meeting.*`
- Update meeting_participants references → `MeetingParticipant.*`

### src/services/poll.service.ts
- Update all `prisma.polls.*` → `Poll.*`
- Update poll_options → `PollOption.*`
- Update poll_responses → `PollResponse.*`

### src/services/messaging.service.ts
- Update conversations → `Conversation.*`
- Update messages → `Message.*`
- Update broadcast_messages → `BroadcastMessage.*`

## 🚀 Testing Steps

After updating each file:

1. Check for TypeScript errors: `cd apps/backend && pnpm build`
2. Try starting the server: `pnpm dev`
3. Test the specific endpoint using Postman/curl
4. Check MongoDB for data changes using MongoDB Compass

## 📝 Common Gotchas

1. **IDs are different**: Prisma uses UUIDs (strings), Mongoose uses ObjectIds
   - Solution: Use `.toString()` when sending to frontend

2. **Timestamps**: Mongoose auto-manages createdAt/updatedAt if enabled in schema
   - Already configured in all models

3. **Relations**: Prisma uses `include`, Mongoose uses `populate()`

4. **Transactions**: Different syntax entirely (see examples above)

5. **Enum imports**: Can't import from '@prisma/client', use local enums from models

## 🎯 Priority Order

1. ✅ auth.service.ts (DONE)
2. ✅ activity.service.ts (DONE)  
3. ⚠️ director.service.ts (NEXT - most critical)
4. ⚠️ manager.service.ts
5. ⚠️ supervisor.service.ts
6. ⚠️ notification.service.ts
7. ⚠️ expense.service.ts
8. ⚠️ meeting.service.ts
9. ⚠️ poll.service.ts
10. ⚠️ messaging.service.ts
11. ⚠️ All route files (just enum imports)

## 💡 Pro Tip

Use Find & Replace in VS Code:
- Find: `prisma\.(\w+)\.findUnique\(`
- This helps identify all findUnique calls to replace

**Estimated Time to Complete**: 4-6 hours for all service files
**Most Critical**: director.service.ts, manager.service.ts, supervisor.service.ts (authentication flow depends on these)
