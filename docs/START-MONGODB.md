# MongoDB Startup Guide for Windows

## ✅ Quick Fix - Start MongoDB

### Option 1: MongoDB as Windows Service (Recommended)
If MongoDB was installed as a Windows Service:

```bash
# Start MongoDB service
net start MongoDB

# Check if it's running
sc query MongoDB
```

### Option 2: Start MongoDB Manually
```bash
# Find your MongoDB installation (usually in Program Files)
# Navigate to MongoDB bin folder, then run:
mongod --dbpath "C:\data\db"
```

### Option 3: Check if MongoDB is Already Running
```bash
# Check if MongoDB process is running
tasklist | findstr mongod

# Try connecting to MongoDB
mongosh
# or
mongo
```

## 🔧 If MongoDB is Not Installed

### Download and Install:
1. Visit: https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server for Windows
3. Run installer and select "Complete" installation
4. Choose "Install MongoDB as a Service"
5. Install MongoDB Compass (GUI) if desired

### After Installation:
```bash
# Start the service
net start MongoDB

# Verify connection
mongosh
```

## 📝 After MongoDB is Running

Start your backend:
```bash
cd apps/backend
pnpm dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Database health check passed
🚀 Server is running on port 3002
```

## 🎯 Current Issue
Your error shows:
```
connect ECONNREFUSED ::1:27017
```

This means **MongoDB is not running** on port 27017. Start MongoDB using one of the options above, then restart your backend.
