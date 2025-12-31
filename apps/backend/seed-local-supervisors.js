const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedLocalSupervisors() {
  try {
    const uri = 'mongodb://localhost:27017/javelin';
    console.log('🔗 Connecting to LOCAL MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to LOCAL database\n');

    const db = mongoose.connection.db;

    // Get or create a location
    let locations = await db.collection('locations').find({}).limit(4).toArray();
    
    if (locations.length === 0) {
      console.log('📍 No locations found, creating test location...');
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
      locations = [{ _id: result.insertedId, ...testLocation }];
      console.log(`✅ Created location: ${testLocation.locationName}\n`);
    } else {
      console.log(`📍 Found ${locations.length} existing locations\n`);
    }

    // Check existing supervisors
    const existingCount = await db.collection('supervisors').countDocuments();
    console.log(`📊 Existing supervisors in LOCAL DB: ${existingCount}`);

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
        locationIndex: 0,
      },
      {
        firstName: 'Bob',
        lastName: 'Chief',
        email: 'bob.chief@javelin.com',
        phone: '+2348033333333',
        supervisorType: 'AREA_SUPERVISOR',
        locationIndex: 0,
      },
      {
        firstName: 'Alice',
        lastName: 'Lead',
        email: 'alice.lead@javelin.com',
        phone: '+2348044444444',
        supervisorType: 'FIELD_SUPERVISOR',
        locationIndex: 0,
      },
    ];

    console.log('\n🌱 Creating supervisors in LOCAL database...\n');

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
      const location = locations[data.locationIndex];
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
      console.log(`✅ Created supervisor: ${data.firstName} ${data.lastName} (${data.supervisorType})\n`);
    }

    // Summary
    const totalSupervisors = await db.collection('supervisors').countDocuments();
    const approvedSupervisors = await db.collection('supervisors').countDocuments({ approvalStatus: 'APPROVED' });
    
    console.log('\n📊 LOCAL Database Summary:');
    console.log(`   Total supervisors: ${totalSupervisors}`);
    console.log(`   Approved supervisors: ${approvedSupervisors}`);
    console.log('\n✅ LOCAL supervisor seeding completed!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding local supervisors:', error);
    process.exit(1);
  }
}

seedLocalSupervisors();
