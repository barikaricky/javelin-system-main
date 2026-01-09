const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check raw BITs data
    const bits = await mongoose.connection.db.collection('bits').find({}).limit(5).toArray();
    
    console.log('📊 Total BITs:', bits.length);
    
    if (bits.length > 0) {
      console.log('\n🎯 BIT Details:');
      for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];
        console.log(`\n  BIT ${i + 1}:`);
        console.log('    _id:', bit._id);
        console.log('    bitName:', bit.bitName);
        console.log('    bitCode:', bit.bitCode);
        console.log('    locationId:', bit.locationId);
        
        // Lookup the location
        if (bit.locationId) {
          const location = await mongoose.connection.db.collection('locations').findOne({ _id: bit.locationId });
          console.log('    Location found:', location ? 'Yes' : 'No');
          if (location) {
            console.log('    Location.locationName:', location.locationName);
            console.log('    Location.name:', location.name);
            console.log('    Location fields:', Object.keys(location));
          }
        }
      }
    }
    
    // Check BitExpenses
    console.log('\n\n📋 Checking BitExpenses:');
    const expenses = await mongoose.connection.db.collection('bitexpenses').find({}).limit(3).toArray();
    console.log('Total BitExpenses:', expenses.length);
    if (expenses.length > 0) {
      console.log('\nSample expense fields:', Object.keys(expenses[0]));
      console.log('locationName:', expenses[0].locationName);
      console.log('bitName:', expenses[0].bitName);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
