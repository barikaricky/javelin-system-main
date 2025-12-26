const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

console.log('Connecting to database...');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users with their profilePhoto
    const users = await mongoose.connection.db.collection('users')
      .find({}, { 
        projection: { 
          firstName: 1, 
          lastName: 1, 
          email: 1, 
          role: 1, 
          profilePhoto: 1 
        } 
      })
      .toArray();
    
    console.log(`Total users: ${users.length}\n`);
    console.log('User Profile Photos:\n');
    
    users.forEach(user => {
      console.log(`${user.firstName} ${user.lastName} (${user.role}):`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Profile Photo: ${user.profilePhoto || 'NOT SET'}`);
      console.log('---');
    });
    
    // Check if all users have the same profilePhoto
    const profilePhotos = users.map(u => u.profilePhoto).filter(Boolean);
    const uniquePhotos = [...new Set(profilePhotos)];
    
    console.log(`\n📊 Summary:`);
    console.log(`Total users: ${users.length}`);
    console.log(`Users with profilePhoto: ${profilePhotos.length}`);
    console.log(`Unique profilePhotos: ${uniquePhotos.length}`);
    
    if (uniquePhotos.length === 1 && profilePhotos.length > 1) {
      console.log(`\n⚠️ WARNING: All users have the same profilePhoto: ${uniquePhotos[0]}`);
    } else {
      console.log(`\n✅ Users have different profilePhotos`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
