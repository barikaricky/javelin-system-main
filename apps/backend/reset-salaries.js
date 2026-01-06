const mongoose = require('mongoose');

async function resetSalaries() {
  try {
    await mongoose.connect('mongodb://localhost:27017/javelin');
    console.log('Connected to MongoDB\n');

    const Salary = mongoose.model('Salary', new mongoose.Schema({}, { strict: false, collection: 'salaries' }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

    // DELETE ALL SALARIES
    const deleteResult = await Salary.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} salaries\n`);

    // Get active users
    const users = await User.find({ isActive: true }).limit(5);
    console.log(`Found ${users.length} active users\n`);

    if (users.length === 0) {
      console.log('❌ No active users found');
      await mongoose.connection.close();
      return;
    }

    // Create fresh PENDING salaries
    console.log('Creating new PENDING salaries...\n');
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const baseSalary = 45000 + (i * 5000);
      const transportAllowance = 8000 + (i * 2000);
      
      const salary = new Salary({
        worker: user._id,
        workerName: `${user.firstName} ${user.lastName}`,
        workerRole: user.role === 'OPERATOR' ? 'OPERATOR' : 
                    user.role === 'SUPERVISOR' ? 'SUPERVISOR' : 
                    user.role,
        month: 1,
        year: 2026,
        baseSalary: baseSalary,
        allowances: [
          { 
            name: 'Transport', 
            amount: transportAllowance, 
            description: 'Monthly transport allowance' 
          }
        ],
        deductions: [],
        totalAllowances: transportAllowance,
        totalDeductions: 0,
        netSalary: baseSalary + transportAllowance,
        status: 'PENDING',
        createdBy: user._id,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await salary.save();
      console.log(`✅ ${user.firstName} ${user.lastName} - ₦${(baseSalary + transportAllowance).toLocaleString()} (ID: ${salary._id})`);
    }

    // Verify
    const allSalaries = await Salary.find({});
    console.log(`\n🎉 Total salaries in database: ${allSalaries.length}`);
    console.log('All are PENDING and ready for approval!\n');

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

resetSalaries();
