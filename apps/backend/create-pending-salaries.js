const mongoose = require('mongoose');

async function createPendingSalaries() {
  try {
    await mongoose.connect('mongodb://localhost:27017/javelin');
    console.log('Connected to MongoDB');

    // Get the Salary model
    const Salary = mongoose.model('Salary', new mongoose.Schema({
      worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      workerName: String,
      workerRole: String,
      month: Number,
      year: Number,
      baseSalary: Number,
      allowances: Array,
      deductions: Array,
      totalAllowances: Number,
      totalDeductions: Number,
      netSalary: Number,
      status: String,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      paidAt: Date,
      paymentMethod: String,
      paymentReference: String,
      notes: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isDeleted: { type: Boolean, default: false },
    }, { collection: 'salaries' }));

    // Get the User model
    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      role: String,
      isActive: Boolean
    }, { collection: 'users' }));

    // Find all active users
    const users = await User.find({ isActive: true }).limit(5);
    
    if (users.length === 0) {
      console.log('❌ No active users found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${users.length} active users`);

    // Delete old test salaries
    await Salary.deleteMany({ notes: 'Test salary for debugging' });
    console.log('Cleaned up old test salaries');

    // Create pending salaries for each user
    const pendingSalaries = [];
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const baseSalary = 45000 + (i * 5000); // Varying salaries
      const transportAllowance = 8000 + (i * 2000);
      
      const salary = new Salary({
        worker: user._id,
        workerName: `${user.firstName} ${user.lastName}`,
        workerRole: user.role === 'OPERATOR' ? 'OPERATOR' : 
                    user.role === 'SUPERVISOR' ? 'SUPERVISOR' : 
                    user.role,
        month: 1, // January 2026
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
        status: 'PENDING', // ⭐ PENDING status for approval
        notes: 'Test salary for debugging',
        createdBy: user._id,
        isDeleted: false
      });

      await salary.save();
      pendingSalaries.push(salary);
      console.log(`✅ Created PENDING salary for ${user.firstName} ${user.lastName} - ₦${(baseSalary + transportAllowance).toLocaleString()}`);
    }

    console.log(`\n🎉 Successfully created ${pendingSalaries.length} PENDING salaries!`);
    console.log('\n📋 Summary:');
    console.log('Status: PENDING');
    console.log('Month: January 2026');
    console.log('Total salaries:', pendingSalaries.length);
    console.log('\nThese salaries are now ready for approval testing! 🚀');

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

createPendingSalaries();
