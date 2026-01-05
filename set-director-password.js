const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const password = 'Director2026';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { role: 'DIRECTOR', email: 'barikaricky@gmail.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\n=== PASSWORD UPDATED ===');
    console.log('Email: barikaricky@gmail.com');
    console.log('New Password: Director2026');
    console.log('\nYou can now login with this email and password!');
    console.log('Modified count:', result.modifiedCount);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
