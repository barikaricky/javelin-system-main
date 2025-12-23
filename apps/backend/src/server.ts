import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase } from './utils/database';
import { initializeCronJobs } from './utils/cronJobs';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import onboardingRoutes from './routes/onboarding.routes';
import directorRoutes from './routes/director.routes';
import supervisorRoutes from './routes/supervisor.routes';
import generalSupervisorRoutes from './routes/general-supervisor.routes';
import operatorRoutes from './routes/operator.routes';
import secretaryRoutes from './routes/secretary.routes';
import logsRoutes from './routes/logs.routes';
import expenseRoutes from './routes/expense.routes';
import managerRoutes from './routes/manager.routes';
import userRoutes from './routes/user.routes';
import meetingRoutes from './routes/meeting.routes';
import notificationRoutes from './routes/notification.routes';
import activityRoutes from './routes/activity.routes';
import pollRoutes from './routes/poll.routes';
import messagingRoutes from './routes/messaging.routes';
import transactionRoutes from './routes/transaction.routes';
import moneyInRoutes from './routes/money-in.routes';
import moneyOutRoutes from './routes/money-out.routes';
import salaryRoutes from './routes/salary.routes';
import financialRoutes from './routes/financial.routes';
import clientRoutes from './routes/client.routes';
import invoiceRoutes from './routes/invoice.routes';
import budgetRoutes from './routes/budget.routes';
import locationRoutes from './routes/location.routes';
import bitRoutes from './routes/bit.routes';
import companyDocumentRoutes from './routes/companyDocument.routes';
import idVerificationRoutes from './routes/id-verification.routes';
import assignmentRoutes from './routes/assignment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - MUST be first
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow all GitHub Codespaces origins and localhost
    if (origin.includes('github.dev') || 
        origin.includes('localhost') || 
         origin.includes('h08gkk7g-3000.uks1.devtunnels.ms') || 
         origin.includes('h08gkk7g-5000.uks1.devtunnels.ms') ||
        origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Also allow the configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all for development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Log all CORS requests for debugging
app.use((req, res, next) => {
  logger.info(`🌐 ${req.method} ${req.path}`, {
    origin: req.get('origin'),
    referer: req.get('referer'),
    userAgent: req.get('user-agent'),
    corsHeaders: {
      'access-control-request-method': req.get('access-control-request-method'),
      'access-control-request-headers': req.get('access-control-request-headers'),
    }
  });
  
  // Add CORS headers manually as a fallback
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  next();
});

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  logger.info('✈️  Preflight request received', {
    origin: req.get('origin'),
    method: req.get('access-control-request-method'),
    headers: req.get('access-control-request-headers'),
  });
  res.status(204).send();
});

// Helmet - relaxed for development
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Increase body size limit for base64 images (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    origin: req.get('origin'),
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/general-supervisor', generalSupervisorRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/secretaries', secretaryRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/money-in', moneyInRoutes);
app.use('/api/money-out', moneyOutRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/bits', bitRoutes);
app.use('/api/documents', companyDocumentRoutes);
app.use('/api/verify-id', idVerificationRoutes);
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler (must be last)
app.use(errorHandler);

const startServer = async () => {
  try {
    // Start server first (for Railway healthcheck)
    const startPort = config.port;
    let currentPort = startPort;
    let server: any;
    let maxAttempts = 10;
    
    const tryPort = (port: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        server = app.listen(port, '0.0.0.0', () => {
          logger.info(`🚀 Server is running on port ${port}`);
          logger.info(`📝 Environment: ${config.nodeEnv}`);
          logger.info(`🔗 API URL: http://localhost:${port}`);
          logger.info(`🔗 Health check: http://localhost:${port}/api/health`);
          resolve();
        });
        
        server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            logger.warn(`⚠️  Port ${port} is already in use`);
            server.close();
            reject(err);
          } else {
            logger.error('❌ Server error:', err);
            reject(err);
          }
        });
      });
    };
    
    while (maxAttempts > 0) {
      try {
        await tryPort(currentPort);
        break;
      } catch (err: any) {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`🔄 Trying port ${currentPort + 1}...`);
          currentPort++;
          maxAttempts--;
          if (maxAttempts === 0) {
            throw new Error(`Could not find available port after trying ${startPort} to ${currentPort}`);
          }
        } else {
          throw err;
        }
      }
    }
    
    // Initialize database after server starts (async, non-blocking)
    logger.info('🔄 Initializing database in background...');
    initializeDatabase()
      .then(() => {
        logger.info('✅ Database connected successfully');
        // Initialize cron jobs after database is ready
        initializeCronJobs();
        logger.info('⏰ Cron jobs initialized');
      })
      .catch((err) => {
        logger.error('❌ Database connection failed:', err);
        logger.warn('⚠️ Server running without database connection');
      });
        }
      }
    }
    
    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received: closing HTTP server`);
      if (server) {
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
