// EXAMPLE: How to convert auth.service.ts from Prisma to Mongoose
// This is a reference file showing before/after patterns

import { User } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// ============= PATTERN 1: Find User by Email =============

// ❌ OLD (Prisma):
// const user = await prisma.user.findUnique({
//   where: { email }
// });

// ✅ NEW (Mongoose):
export async function findUserByEmail(email: string) {
  return await User.findOne({ email }).exec();
}

// ============= PATTERN 2: Create User =============

// ❌ OLD (Prisma):
// const user = await prisma.user.create({
//   data: {
//     email,
//     passwordHash,
//     firstName,
//     lastName,
//     role: 'OPERATOR',
//     status: 'PENDING'
//   }
// });

// ✅ NEW (Mongoose):
export async function createUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  const user = await User.create({
    email: data.email,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    status: 'PENDING',
  });
  return user;
}

// ============= PATTERN 3: Update User =============

// ❌ OLD (Prisma):
// const updated = await prisma.user.update({
//   where: { id: userId },
//   data: { lastLogin: new Date() }
// });

// ✅ NEW (Mongoose):
export async function updateLastLogin(userId: string) {
  const updated = await User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true } // Returns the updated document
  ).exec();
  return updated;
}

// ============= PATTERN 4: Find with Relations (Include) =============

// ❌ OLD (Prisma):
// const user = await prisma.user.findUnique({
//   where: { id },
//   include: {
//     director: true,
//     manager: true,
//     supervisor: true
//   }
// });

// ✅ NEW (Mongoose):
export async function findUserWithRelations(id: string) {
  const user = await User.findById(id)
    .populate('director')
    .populate('manager')
    .populate('supervisor')
    .exec();
  return user;
}

// ============= PATTERN 5: Find Many with Filter =============

// ❌ OLD (Prisma):
// const users = await prisma.user.findMany({
//   where: {
//     role: 'SUPERVISOR',
//     status: 'ACTIVE'
//   },
//   orderBy: {
//     createdAt: 'desc'
//   },
//   take: 10
// });

// ✅ NEW (Mongoose):
export async function findActiveSupervisors() {
  const users = await User.find({
    role: 'SUPERVISOR',
    status: 'ACTIVE',
  })
    .sort({ createdAt: -1 }) // -1 for desc, 1 for asc
    .limit(10)
    .exec();
  return users;
}

// ============= PATTERN 6: Count Documents =============

// ❌ OLD (Prisma):
// const count = await prisma.user.count({
//   where: { status: 'ACTIVE' }
// });

// ✅ NEW (Mongoose):
export async function countActiveUsers() {
  const count = await User.countDocuments({ status: 'ACTIVE' });
  return count;
}

// ============= PATTERN 7: Delete =============

// ❌ OLD (Prisma):
// await prisma.user.delete({
//   where: { id }
// });

// ✅ NEW (Mongoose):
export async function deleteUser(id: string) {
  await User.findByIdAndDelete(id);
}

// ============= PATTERN 8: Update Many =============

// ❌ OLD (Prisma):
// await prisma.user.updateMany({
//   where: { status: 'PENDING' },
//   data: { status: 'INACTIVE' }
// });

// ✅ NEW (Mongoose):
export async function deactivatePendingUsers() {
  await User.updateMany(
    { status: 'PENDING' },
    { $set: { status: 'INACTIVE' } }
  );
}

// ============= PATTERN 9: Find or Create =============

// ❌ OLD (Prisma):
// const user = await prisma.user.upsert({
//   where: { email },
//   update: { lastLogin: new Date() },
//   create: { email, ...newUserData }
// });

// ✅ NEW (Mongoose):
export async function findOrCreateUser(email: string, userData: any) {
  let user = await User.findOne({ email });
  
  if (!user) {
    user = await User.create({ email, ...userData });
  } else {
    user.lastLogin = new Date();
    await user.save();
  }
  
  return user;
}

// ============= PATTERN 10: Complex Queries =============

// ❌ OLD (Prisma):
// const users = await prisma.user.findMany({
//   where: {
//     OR: [
//       { email: { contains: searchTerm } },
//       { firstName: { contains: searchTerm } }
//     ],
//     status: 'ACTIVE'
//   }
// });

// ✅ NEW (Mongoose):
export async function searchActiveUsers(searchTerm: string) {
  const users = await User.find({
    $or: [
      { email: { $regex: searchTerm, $options: 'i' } },
      { firstName: { $regex: searchTerm, $options: 'i' } },
    ],
    status: 'ACTIVE',
  }).exec();
  return users;
}

// ============= PATTERN 11: Transactions =============

// ❌ OLD (Prisma):
// await prisma.$transaction(async (tx) => {
//   const user = await tx.user.create({ data: userData });
//   await tx.director.create({ data: { userId: user.id, ...directorData } });
// });

// ✅ NEW (Mongoose):
import mongoose from 'mongoose';
import { Director } from '../models';

export async function createDirectorWithUser(userData: any, directorData: any) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const user = await User.create([userData], { session });
    await Director.create([{
      userId: user[0]._id,
      ...directorData
    }], { session });
    
    await session.commitTransaction();
    return user[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ============= KEY DIFFERENCES SUMMARY =============

/*
1. IDs:
   - Prisma: Uses string UUIDs
   - Mongoose: Uses ObjectId (still works as string)

2. Relations:
   - Prisma: Uses 'include' 
   - Mongoose: Uses 'populate()'

3. Filtering:
   - Prisma: { where: { field: value } }
   - Mongoose: { field: value }

4. Operators:
   - Prisma: { contains, startsWith, endsWith }
   - Mongoose: { $regex, $gt, $lt, $in, $or }

5. Ordering:
   - Prisma: orderBy: { field: 'desc' }
   - Mongoose: sort({ field: -1 })

6. Limiting:
   - Prisma: take: 10
   - Mongoose: limit(10)

7. Updates:
   - Prisma: update({ where, data })
   - Mongoose: findByIdAndUpdate(id, data, { new: true })

8. Creates:
   - Prisma: create({ data })
   - Mongoose: create({ ...data })
*/

// ============= IMPORTANT NOTES =============

/*
1. Always use .exec() for better TypeScript support
2. Use { new: true } in updates to get the updated document
3. MongoDB ObjectIds work as strings in most cases
4. Remember to handle null/undefined differently
5. Mongoose has built-in timestamps if enabled in schema
*/
