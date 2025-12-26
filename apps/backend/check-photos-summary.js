const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

console.log('Connecting to database...');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users with their profilePhoto (without the base64 data)
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
    
    console.log(`📊 Total users: ${users.length}\n`);
    
    // Show first 100 chars of each profilePhoto
    users.forEach(user => {
      const photoPreview = user.profilePhoto 
        ? (user.profilePhoto.substring(0, 50) + '...')
        : 'NOT SET';
      console.log(`${user.firstName} ${user.lastName} (${user.role}):`);
      console.log(`  Profile Photo: ${photoPreview}`);
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
      console.log(`\n⚠️ WARNING: All users have the same profilePhoto!`);
      console.log(`All users are using: ${uniquePhotos[0].substring(0, 50)}...`);
    } else if (uniquePhotos.length > 1) {
      console.log(`\n✅ Users have different profilePhotos`);
    } else {
      console.log(`\n❓ Only one user has a profilePhoto`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
