const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedSupervisors() {
  try {
    const uri = 'mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/jevelin_db';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get locations
    const locations = await db.collection('locations').find({}).limit(4).toArray();
    console.log(`📍 Found ${locations.length} locations`);
    
    // If no locations, create a default one for testing
    let useLocation = null;
    if (locations.length === 0) {
      console.log('⚠️  No locations found, creating a test location...');
      const testLocation = {
        locationName: 'Test Location',
        locationCode: 'TEST001',
        address: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        locationType: 'CLIENT_SITE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection('locations').insertOne(testLocation);
      useLocation = { _id: result.insertedId, ...testLocation };
      console.log(`✅ Created test location: ${useLocation.locationName}\n`);
    } else {
      useLocation = locations[0];
    }

    // Check existing supervisors
    const existingCount = await db.collection('supervisors').countDocuments();
    console.log(`📊 Existing supervisors: ${existingCount}`);

    const supervisorsData = [
      {
        firstName: 'John',
        lastName: 'Supervisor',
        email: 'john.supervisor@javelin.com',
        phone: '+2348011111111',
        supervisorType: 'FIELD_SUPERVISOR',
        locationIndex: 0,
      },
      {
        firstName: 'Jane',
        lastName: 'Manager',
        email: 'jane.manager@javelin.com',
        phone: '+2348022222222',
        supervisorType: 'SHIFT_SUPERVISOR',
        locationIndex: 1,
      },
      {
        firstName: 'Bob',
        lastName: 'Chief',
        email: 'bob.chief@javelin.com',
        phone: '+2348033333333',
        supervisorType: 'AREA_SUPERVISOR',
        locationIndex: 2,
      },
      {
        firstName: 'Alice',
        lastName: 'Lead',
        email: 'alice.lead@javelin.com',
        phone: '+2348044444444',
        supervisorType: 'FIELD_SUPERVISOR',
        locationIndex: 3 % locations.length,
      },
    ];

    console.log('\n🌱 Creating supervisors...\n');

    for (const data of supervisorsData) {
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email: data.email });
      if (existingUser) {
        console.log(`⏭️  User ${data.email} already exists, skipping...`);
        continue;
      }

      // Create user account
      const hashedPassword = await bcrypt.hash('Supervisor123!', 10);
      const userResult = await db.collection('users').insertOne({
        email: data.email,
        phoneNumber: data.phone,
        passwordHash: hashedPassword,
        role: 'SUPERVISOR',
        status: 'ACTIVE',
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userId = userResult.insertedId;
      console.log(`👤 Created user: ${data.firstName} ${data.lastName}`);

      // Create supervisor profile
      const location = locations.length > data.locationIndex ? locations[data.locationIndex] : useLocation;
      await db.collection('supervisors').insertOne({
        userId: userId,
        fullName: `${data.firstName} ${data.lastName}`,
        supervisorType: data.supervisorType,
        locationId: location._id,
        approvalStatus: 'APPROVED',
        salary: 80000 + Math.floor(Math.random() * 40000),
        dateJoined: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created supervisor: ${data.firstName} ${data.lastName} (${data.supervisorType}) at ${location.locationName}\n`);
    }

    // Summary
    const totalSupervisors = await db.collection('supervisors').countDocuments();
    const approvedSupervisors = await db.collection('supervisors').countDocuments({ approvalStatus: 'APPROVED' });
    
    console.log('\n📊 Summary:');
    console.log(`   Total supervisors: ${totalSupervisors}`);
    console.log(`   Approved supervisors: ${approvedSupervisors}`);
    console.log('\n✅ Supervisor seeding completed!\n');

    // Display credentials
    console.log('🔑 Login Credentials:');
    supervisorsData.forEach((s) => {
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: Supervisor123!`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding supervisors:', error);
    process.exit(1);
  }
}

seedSupervisors();
