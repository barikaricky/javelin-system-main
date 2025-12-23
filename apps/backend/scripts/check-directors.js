const mongoose = require('mongoose');
require('dotenv').config();

async function checkDirectors() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to database');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const directors = await User.find({ role: 'DIRECTOR' }).select('email firstName lastName status passwordHash');
    
    console.log('\n=== Directors found:', directors.length, '===\n');
    
    if (directors.length === 0) {
      console.log('No directors found. You need to create one first.');
      console.log('Visit /dev/onboarding to create the director account.\n');
    } else {
      directors.forEach((d, index) => {
        console.log(`Director ${index + 1}:`);
        console.log('  Email:', d.email);
        console.log('  Name:', d.firstName, d.lastName);
        console.log('  Status:', d.status);
        console.log('  Has password:', !!d.passwordHash);
        console.log();
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDirectors();
