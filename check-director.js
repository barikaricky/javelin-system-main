const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const user = await mongoose.connection.db.collection('users').findOne({ 
      email: 'barikaricky@gmail.com' 
    });
    
    console.log('=== DIRECTOR USER DOCUMENT ===');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n=== KEY FIELDS ===');
    console.log('Has password:', !!user?.password);
    console.log('Password length:', user?.password?.length || 0);
    console.log('Role:', user?.role);
    console.log('Email:', user?.email);
    console.log('IsActive:', user?.isActive);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
