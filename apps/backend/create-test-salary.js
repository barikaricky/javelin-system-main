const mongoose = require('mongoose');

async function createTestSalary() {
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
      deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      deletedAt: Date,
      deleteReason: String
    }, { timestamps: true }));

    // Get a user to use as worker (first user in database)
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const firstUser = await User.findOne({});
    
    if (!firstUser) {
      console.error('No users found in database. Please create a user first.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Using user:', firstUser.firstName, firstUser.lastName);

    // Check if salary already exists
    const existing = await Salary.findOne({ 
      workerName: `${firstUser.firstName} ${firstUser.lastName}`,
      month: 12,
      year: 2025
    });

    if (existing) {
      console.log('Test salary already exists. Updating to PAID status...');
      existing.status = 'PAID';
      existing.paidAt = new Date();
      existing.paymentMethod = 'BANK_TRANSFER';
      existing.isDeleted = false;
      await existing.save();
      console.log('Updated existing salary to PAID');
    } else {
      // Create test salary
      const testSalary = new Salary({
        worker: firstUser._id,
        workerName: `${firstUser.firstName} ${firstUser.lastName}`,
        workerRole: firstUser.role === 'OPERATOR' ? 'OPERATOR' : 'SUPERVISOR',
        month: 12,
        year: 2025,
        baseSalary: 50000,
        allowances: [
          { name: 'Transport', amount: 10000, description: 'Monthly transport allowance' }
        ],
        deductions: [],
        totalAllowances: 10000,
        totalDeductions: 0,
        netSalary: 60000,
        status: 'PAID',
        approvedBy: firstUser._id,
        approvedAt: new Date(),
        paidBy: firstUser._id,
        paidAt: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: 'TEST-REF-001',
        notes: 'Test salary for debugging',
        createdBy: firstUser._id,
        isDeleted: false
      });

      await testSalary.save();
      console.log('✅ Created test salary successfully!');
    }

    // Verify
    const allSalaries = await Salary.find({ isDeleted: false });
    console.log(`\nTotal salaries in database: ${allSalaries.length}`);
    allSalaries.forEach(s => {
      console.log(`- ${s.workerName}: ₦${s.netSalary} (${s.status}) - ${s.month}/${s.year}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

createTestSalary();
