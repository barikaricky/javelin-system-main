const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/jevelin_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const gsId = '694908fc6ec1f9060213edd5'; // General Supervisor ID
    const supId = '69490bee6ec1f9060213ee5b'; // Supervisor ID
    
    // Update supervisor to link to GS
    const result = await mongoose.connection.db.collection('supervisors').updateOne(
      { _id: new mongoose.Types.ObjectId(supId) },
      { $set: { generalSupervisorId: new mongoose.Types.ObjectId(gsId) } }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✅ Supervisor successfully linked to General Supervisor!');
      
      // Verify
      const updated = await mongoose.connection.db.collection('supervisors').findOne(
        { _id: new mongoose.Types.ObjectId(supId) }
      );
      console.log('\nUpdated supervisor:');
      console.log('- Full Name:', updated.fullName);
      console.log('- General Supervisor ID:', updated.generalSupervisorId);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
