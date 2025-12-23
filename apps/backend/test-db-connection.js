require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/javelin_db';

console.log('🔄 Testing MongoDB connection...');
console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    process.exit(1);
  });
