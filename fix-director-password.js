const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/javelin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  
  const password = 'Director2026';
  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      process.exit(1);
    }
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { role: 'DIRECTOR', email: 'barikaricky@gmail.com' },
      { 
        $set: { 
          passwordHash: hashedPassword,
          password: hashedPassword // Update both fields to be safe
        } 
      }
    );
    
    console.log('PASSWORD UPDATED IN BOTH FIELDS');
    console.log('Email: barikaricky@gmail.com');
    console.log('New Password: Director2026');
    console.log('Modified count:', result.modifiedCount);
    process.exit(0);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
