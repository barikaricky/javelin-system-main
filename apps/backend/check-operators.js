const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/jevelin_db';

async function checkOperators() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get operators collection
    const operators = await db.collection('operators').find({}).toArray();
    console.log('\n📊 Total Operators:', operators.length);
    
    if (operators.length > 0) {
      console.log('\n📋 Operators:');
      for (const operator of operators) {
        // Get user info
        const user = await db.collection('users').findOne({ _id: operator.userId });
        
        // Get supervisor info
        const supervisor = await db.collection('supervisors').findOne({ _id: operator.supervisorId });
        const supervisorUser = supervisor ? await db.collection('users').findOne({ _id: supervisor.userId }) : null;
        
        // Get location info
        const location = operator.locationId ? await db.collection('locations').findOne({ _id: operator.locationId }) : null;
        
        console.log(`\n  👤 ${user?.firstName} ${user?.lastName}`);
        console.log(`     Email: ${user?.email}`);
        console.log(`     Status: ${user?.status}`);
        console.log(`     Employee ID: ${operator.employeeId}`);
        console.log(`     Supervisor: ${supervisorUser?.firstName} ${supervisorUser?.lastName || 'N/A'}`);
        console.log(`     Location: ${location?.name || 'N/A'}`);
        console.log(`     Salary: ${operator.salary}`);
        console.log(`     Created: ${operator.createdAt || 'N/A'}`);
      }
    } else {
      console.log('\n❌ No operators found in database');
      console.log('💡 Tip: Register an operator using the Supervisor portal first');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOperators();
