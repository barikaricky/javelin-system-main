const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/jevelin_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Check supervisors collection
    const supervisors = await mongoose.connection.db.collection('supervisors').find({}).toArray();
    console.log('📊 Total supervisors:', supervisors.length);
    console.log('\n');
    
    if (supervisors.length > 0) {
      console.log('ALL Supervisors:');
      supervisors.forEach((sup, index) => {
        console.log(`\n--- Supervisor ${index + 1} ---`);
        console.log('ID:', sup._id);
        console.log('User ID:', sup.userId);
        console.log('Employee ID:', sup.employeeId);
        console.log('Type:', sup.supervisorType);
        console.log('Full Name:', sup.fullName);
        console.log('General Supervisor ID:', sup.generalSupervisorId || 'None');
      });
      
      console.log('\n');
      // Check supervisorType values
      const types = {};
      supervisors.forEach(sup => {
        const type = sup.supervisorType || 'NONE';
        types[type] = (types[type] || 0) + 1;
      });
      console.log('Supervisor types:');
      console.log(types);
    } else {
      console.log('⚠️ No supervisors found in database');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
