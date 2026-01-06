const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections found:', collections.length, '\n');
    
    // Count documents in each collection
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documents`);
    }
    
    console.log('\n');
    
    // Check specific collections
    const managers = await mongoose.connection.db.collection('managers').countDocuments();
    const supervisors = await mongoose.connection.db.collection('supervisors').countDocuments();
    const operators = await mongoose.connection.db.collection('operators').countDocuments();
    const secretaries = await mongoose.connection.db.collection('secretaries').countDocuments();
    const locations = await mongoose.connection.db.collection('locations').countDocuments();
    
    console.log('Staff counts:');
    console.log('- Managers:', managers);
    console.log('- Supervisors:', supervisors);
    console.log('- Operators:', operators);
    console.log('- Secretaries:', secretaries);
    console.log('- Locations:', locations);
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
