const mongoose = require('mongoose');

async function debugSalaries() {
  try {
    await mongoose.connect('mongodb://localhost:27017/javelin');
    console.log('Connected to MongoDB\n');

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

    // Get all salaries
    const allSalaries = await Salary.find({});
    console.log(`📊 Total salaries in database: ${allSalaries.length}\n`);

    if (allSalaries.length === 0) {
      console.log('❌ No salaries found!');
      await mongoose.connection.close();
      return;
    }

    // Show detailed info for each salary
    console.log('📋 Salary Details:\n');
    allSalaries.forEach((salary, index) => {
      console.log(`${index + 1}. ${salary.workerName || 'Unknown'}`);
      console.log(`   ID: ${salary._id}`);
      console.log(`   Status: ${salary.status}`);
      console.log(`   Month/Year: ${salary.month}/${salary.year}`);
      console.log(`   Net Salary: ₦${salary.netSalary?.toLocaleString() || 0}`);
      console.log(`   Deleted: ${salary.isDeleted}`);
      console.log(`   Created: ${salary.createdAt || 'N/A'}`);
      console.log('');
    });

    // Count by status
    const statusCounts = {};
    allSalaries.forEach(s => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    console.log('📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Show PENDING salaries specifically
    const pendingSalaries = allSalaries.filter(s => s.status === 'PENDING' && !s.isDeleted);
    console.log(`\n✅ PENDING salaries (can be approved): ${pendingSalaries.length}`);
    pendingSalaries.forEach(s => {
      console.log(`   - ${s.workerName} (${s._id})`);
    });

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

debugSalaries();
