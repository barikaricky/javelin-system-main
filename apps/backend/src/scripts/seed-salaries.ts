/**
 * Seed script to create sample salary records for testing
 * Run with: npx ts-node src/scripts/seed-salaries.ts
 */
import mongoose from 'mongoose';
import { Salary, WorkerRole, SalaryStatus } from '../models/Salary.model';
import { User } from '../models/User.model';
import config from '../config';

async function seedSalaries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Find all users except directors
    const workers = await User.find({ 
      role: { $in: ['OPERATOR', 'SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'SECRETARY'] }
    });

    console.log(`Found ${workers.length} workers to create salaries for`);

    if (workers.length === 0) {
      console.log('No workers found. Please create some users first.');
      process.exit(0);
    }

    // Get a Managing Director for createdBy field
    const md = await User.findOne({ role: 'DIRECTOR', isManagingDirector: true });
    if (!md) {
      console.log('No Managing Director found. Creating sample salaries without createdBy...');
    }

    // Define base salaries by role
    const baseSalaries: Record<WorkerRole, number> = {
      [WorkerRole.OPERATOR]: 50000,
      [WorkerRole.SUPERVISOR]: 75000,
      [WorkerRole.GENERAL_SUPERVISOR]: 100000,
      [WorkerRole.MANAGER]: 150000,
      [WorkerRole.SECRETARY]: 120000
    };

    // Common allowances
    const commonAllowances = [
      { name: 'Housing', amount: 15000, description: 'Housing allowance' },
      { name: 'Transport', amount: 10000, description: 'Transport allowance' },
      { name: 'Lunch', amount: 5000, description: 'Lunch allowance' }
    ];

    // Delete existing salaries for current month
    await Salary.deleteMany({ month: currentMonth, year: currentYear });
    console.log(`Cleared existing salaries for ${currentMonth}/${currentYear}`);

    // Create salary records
    const salaryPromises = workers.map(async (worker) => {
      const workerRole = worker.role as WorkerRole;
      const baseSalary = baseSalaries[workerRole] || 50000;

      return Salary.create({
        worker: worker._id,
        workerName: worker.name,
        workerRole: workerRole,
        month: currentMonth,
        year: currentYear,
        baseSalary: baseSalary,
        allowances: commonAllowances,
        deductions: [],
        status: SalaryStatus.PENDING,
        createdBy: md?._id || worker._id,
        isDeleted: false
      });
    });

    const createdSalaries = await Promise.all(salaryPromises);
    console.log(`✅ Created ${createdSalaries.length} salary records for ${currentMonth}/${currentYear}`);

    // Display summary
    const summary = createdSalaries.reduce((acc, salary) => {
      acc[salary.workerRole] = (acc[salary.workerRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nSummary by Role:');
    Object.entries(summary).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} worker(s)`);
    });

    // Calculate totals
    const totalBaseSalary = createdSalaries.reduce((sum, s) => sum + s.baseSalary, 0);
    const totalAllowances = createdSalaries.reduce((sum, s) => sum + s.totalAllowances, 0);
    const totalNetSalary = createdSalaries.reduce((sum, s) => sum + s.netSalary, 0);

    console.log('\nFinancial Summary:');
    console.log(`  Total Base Salary: ₦${totalBaseSalary.toLocaleString()}`);
    console.log(`  Total Allowances: ₦${totalAllowances.toLocaleString()}`);
    console.log(`  Total Net Salary: ₦${totalNetSalary.toLocaleString()}`);

    console.log('\n✅ Salary seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding salaries:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSalaries();
