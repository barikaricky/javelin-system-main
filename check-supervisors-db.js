const mongoose = require('mongoose');
require('dotenv').config({ path: './apps/backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('Connecting to MongoDB...');
console.log('URI:', MONGODB_URI ? 'Found' : 'Not Found');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Define schema
    const SupervisorSchema = new mongoose.Schema({}, { strict: false, collection: 'supervisors' });
    const Supervisor = mongoose.model('Supervisor', SupervisorSchema);

    // Count all supervisors
    const totalCount = await Supervisor.countDocuments();
    console.log(`📊 Total Supervisors: ${totalCount}\n`);

    // Count by supervisor type
    const generalSupervisorCount = await Supervisor.countDocuments({ supervisorType: 'GENERAL_SUPERVISOR' });
    const supervisorCount = await Supervisor.countDocuments({ supervisorType: 'SUPERVISOR' });
    console.log(`👔 General Supervisors: ${generalSupervisorCount}`);
    console.log(`👤 Regular Supervisors: ${supervisorCount}\n`);

    // Get sample supervisors
    console.log('📋 Sample Supervisors:');
    const supervisors = await Supervisor.find().limit(10);
    supervisors.forEach(s => {
      console.log({
        _id: s._id,
        supervisorType: s.supervisorType,
        generalSupervisorId: s.generalSupervisorId || 'NOT SET',
        userId: s.userId
      });
    });

    // Check if any supervisors have generalSupervisorId
    const linkedCount = await Supervisor.countDocuments({ 
      generalSupervisorId: { $exists: true, $ne: null } 
    });
    console.log(`\n🔗 Supervisors with generalSupervisorId: ${linkedCount}`);

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
