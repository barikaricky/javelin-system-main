import mongoose from 'mongoose';
import { Manager, Supervisor, Operator, Secretary, Location } from '../models';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections:', collections.map(c => c.name).join(', '), '\n');
    
    // Count staff
    const managers = await Manager.countDocuments();
    const allSupervisors = await Supervisor.countDocuments();
    const generalSupervisors = await Supervisor.countDocuments({ supervisorType: 'GENERAL_SUPERVISOR', approvalStatus: 'APPROVED' });
    const regularSupervisors = await Supervisor.countDocuments({ supervisorType: 'SUPERVISOR', approvalStatus: 'APPROVED' });
    const pendingSupervisors = await Supervisor.countDocuments({ approvalStatus: 'PENDING' });
    const operators = await Operator.countDocuments();
    const secretaries = await Secretary.countDocuments();
    const locations = await Location.countDocuments();
    const activeLocations = await Location.countDocuments({ isActive: true });
    
    console.log('📊 Staff Counts:');
    console.log('  Managers:', managers);
    console.log('  All Supervisors:', allSupervisors);
    console.log('  - General Supervisors (Approved):', generalSupervisors);
    console.log('  - Regular Supervisors (Approved):', regularSupervisors);
    console.log('  - Pending Approval:', pendingSupervisors);
    console.log('  Operators:', operators);
    console.log('  Secretaries:', secretaries);
    console.log('  Total Locations:', locations);
    console.log('  Active Locations:', activeLocations);
    console.log('');
    
    // Show sample data
    if (managers > 0) {
      const sampleManager = await Manager.findOne().populate('userId', 'firstName lastName');
      console.log('Sample Manager:', sampleManager);
    }
    
    if (locations > 0) {
      const sampleLocation = await Location.findOne();
      console.log('Sample Location:', JSON.stringify(sampleLocation, null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkData();
