const mongoose = require('mongoose');

async function activateUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/javelin');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      role: String,
      isActive: Boolean
    }, { collection: 'users' }));

    // Find all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      await mongoose.connection.close();
      return;
    }

    // Show current user status
    console.log('\n👥 Current users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - Active: ${user.isActive || false}`);
    });

    // Activate all users
    const result = await User.updateMany(
      {},
      { $set: { isActive: true } }
    );

    console.log(`\n✅ Activated ${result.modifiedCount} users`);

    // Verify
    const activeUsers = await User.find({ isActive: true });
    console.log(`\n✅ Active users now: ${activeUsers.length}`);

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

activateUsers();
