/**
 * Migration script to populate User.monthlySalary from existing Supervisor/Secretary/Operator records
 * Run with: npx tsx src/scripts/migrate-salaries.ts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, Supervisor, Secretary, Operator } from '../models';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

async function migrateSalaries() {
  try {
    console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let updatedCount = 0;

    // Migrate Supervisors
    const supervisors = await Supervisor.find({ salary: { $exists: true, $gt: 0 } }).lean();
    console.log(`\nFound ${supervisors.length} supervisors with salary data`);
    
    for (const supervisor of supervisors) {
      const result = await User.findByIdAndUpdate(
        supervisor.userId,
        { 
          $set: { 
            monthlySalary: supervisor.salary,
            accountName: supervisor.fullName,
            bankName: supervisor.bankName,
            accountNumber: supervisor.bankAccountNumber
          } 
        },
        { new: true }
      );
      if (result) {
        console.log(`  ✓ Updated supervisor: ${result.firstName} ${result.lastName} - ₦${supervisor.salary}`);
        updatedCount++;
      }
    }

    // Migrate Secretaries
    const secretaries = await Secretary.find({ salary: { $exists: true, $gt: 0 } }).lean();
    console.log(`\nFound ${secretaries.length} secretaries with salary data`);
    
    for (const secretary of secretaries) {
      const result = await User.findByIdAndUpdate(
        secretary.userId,
        { 
          $set: { 
            monthlySalary: secretary.salary,
            accountName: secretary.fullName,
            bankName: secretary.bankName,
            accountNumber: secretary.bankAccountNumber
          } 
        },
        { new: true }
      );
      if (result) {
        console.log(`  ✓ Updated secretary: ${result.firstName} ${result.lastName} - ₦${secretary.salary}`);
        updatedCount++;
      }
    }

    // Migrate Operators
    const operators = await Operator.find({ salary: { $exists: true, $gt: 0 } }).lean();
    console.log(`\nFound ${operators.length} operators with salary data`);
    
    for (const operator of operators) {
      const user = await User.findById(operator.userId).lean();
      if (user) {
        const result = await User.findByIdAndUpdate(
          operator.userId,
          { 
            $set: { 
              monthlySalary: operator.salary,
              accountName: `${user.firstName} ${user.lastName}`,
            } 
          },
          { new: true }
        );
        if (result) {
          console.log(`  ✓ Updated operator: ${result.firstName} ${result.lastName} - ₦${operator.salary}`);
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Migration completed! Updated ${updatedCount} users`);
    
    // Show summary
    const usersWithSalary = await User.countDocuments({ monthlySalary: { $gt: 0 } });
    console.log(`📊 Total users with monthly salary: ${usersWithSalary}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateSalaries();
