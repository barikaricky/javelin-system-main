# Jevelin Association Company - Management System

> **🎉 NOW RUNNING ON MONGODB! Complete MERN Stack Application**

A secure, scalable management application for security staffing operations with role-based access control for Directors, Supervisors, Operators, and Secretary roles.

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **MongoDB** + **Mongoose ODM**
- JWT Authentication
- Winston Logging
- Multer File Uploads

### Frontend
- **React** + **TypeScript** + **Vite**
- Tailwind CSS
- Axios API Client

## 📁 Project Structure

```
jevelin-management-system/
├── apps/
│   ├── backend/          # Express.js + TypeScript + Mongoose API
│   │   ├── src/
│   │   │   ├── models/      # 25 Mongoose models
│   │   │   ├── services/    # Business logic
│   │   │   ├── routes/      # API endpoints
│   │   │   └── middlewares/ # Auth, validation, errors
│   └── frontend/         # React + TypeScript + Vite UI
├── docs/                 # Documentation
└── package.json          # Monorepo configuration
```

## 🎯 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0 (running locally or cloud)
- **pnpm** (recommended) or npm
- Git

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd jevelin-management-system-main
   pnpm install
   ```

2. **Start MongoDB**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongodb
   # or
   brew services start mongodb-community
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   
   # Edit .env and set:
   DATABASE_URL="mongodb://localhost:27017/jevelin"
   
   # Frontend  
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Create Initial Director User** (see START-HERE.md for details)
   ```javascript
   // Using mongosh or MongoDB Compass
   use jevelin
   
   db.users.insertOne({
     email: "director@jevelin.com",
     firstName: "Admin",
     lastName: "Director",
     passwordHash: "$2a$10$...", // Hash "admin123" with bcrypt
     role: "DIRECTOR",
     status: "ACTIVE",
     employeeId: "DIR-001",
     createdAt: new Date()
   })
   
   // Then create director profile with user's _id
   db.directors.insertOne({
     userId: ObjectId("..."),
     employeeId: "DIR-001"
   })
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   - Backend API: http://localhost:3001
   - Frontend: http://localhost:3000

## Development

### Available Scripts

- `npm run dev` - Start both backend and frontend
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Initial Setup - Director Account

**IMPORTANT**: Before anyone can use the system, you must create the Director account using the developer-only page.

1. **Set the Developer Token** in `apps/backend/.env`:
   ```bash
   DEVELOPER_ONBOARDING_TOKEN="your-secure-token-here-min-32-chars"
   ```

2. **Access the hidden developer page**:
   ```
   http://localhost:3000/dev/init-director
   ```

3. **Fill in the Director details** and use the developer token

4. **Save the generated credentials** - they will only be shown once

5. **Remove or protect this route** in production by:
   - Deleting the route from `apps/frontend/src/App.tsx`
   - Or adding IP whitelist/VPN restrictions
   - Or removing after director creation

### Security Notes

- The `/dev/init-director` page should **NEVER** be accessible in production
- Only ONE director account can exist in the system
- The developer token must be at least 32 characters long
- All credentials are sent via email and displayed once
- Director must change password on first login

### Project Roles

1. **Director** - Full system access, manages supervisors, approvals, analytics
2. **Supervisor** - Manages operators, assigns shifts, submits reports
3. **Operator** - Security guards, view shifts, check-in/out, view payslips
4. **Secretary** - Payroll admin, approve payments, send notifications

## Technology Stack

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (sessions/cache)
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

### Infrastructure
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## Security Features

- Role-Based Access Control (RBAC)
- Secure password hashing (bcrypt)
- JWT tokens with refresh mechanism
- Field-level encryption for sensitive data
- HTTPS/TLS enforcement
- Audit logging
- 2FA support for Director/Secretary

## License

Proprietary - jevelin Association Company

## Contact

For development queries, contact the project team.
