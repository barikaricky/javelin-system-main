const mongoose = require('mongoose');

async function checkSalaryQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/javelin');
    console.log('Connected to MongoDB\n');

    const Salary = mongoose.model('Salary', new mongoose.Schema({}, { strict: false, collection: 'salaries' }));

    // This is what the backend queries for listing salaries
    const query = { isDeleted: false };
    const salaries = await Salary.find(query).sort({ createdAt: -1 });

    console.log(`📊 Salaries returned by listing endpoint: ${salaries.length}\n`);

    salaries.forEach((salary, index) => {
      console.log(`${index + 1}. ${salary.workerName}`);
      console.log(`   ID: ${salary._id}`);
      console.log(`   Status: ${salary.status}`);
      console.log(`   Deleted: ${salary.isDeleted}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

checkSalaryQuery();
