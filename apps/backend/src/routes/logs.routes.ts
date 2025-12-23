import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const router = Router();

// Only directors can access logs
router.use(authenticate);
router.use(authorize('DIRECTOR'));

// Get logs
router.get('/', async (req, res, next) => {
  try {
    const { level = 'all', limit = 100 } = req.query;
    const logsDir = path.join(__dirname, '../../logs');
    
    let logFile: string;
    
    switch (level) {
      case 'error':
        logFile = 'error.log';
        break;
      case 'combined':
        logFile = 'combined.log';
        break;
      default:
        logFile = 'combined.log';
    }
    
    const logPath = path.join(logsDir, logFile);
    
    try {
      const logContent = await fs.readFile(logPath, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      // Get the last N lines
      const limitNum = parseInt(limit as string, 10);
      const recentLines = lines.slice(-limitNum);
      
      // Parse JSON logs
      const logs = recentLines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line };
          }
        })
        .reverse(); // Most recent first
      
      res.json({
        total: logs.length,
        logs,
      });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        res.json({
          total: 0,
          logs: [],
          message: 'Log file not found',
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    next(error);
  }
});

// Get error logs only
router.get('/errors', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const logsDir = path.join(__dirname, '../../logs');
    const errorLogPath = path.join(logsDir, 'error.log');
    
    try {
      const logContent = await fs.readFile(errorLogPath, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const limitNum = parseInt(limit as string, 10);
      const recentLines = lines.slice(-limitNum);
      
      const logs = recentLines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line };
          }
        })
        .reverse();
      
      res.json({
        total: logs.length,
        logs,
      });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        res.json({
          total: 0,
          logs: [],
          message: 'Error log file not found',
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    next(error);
  }
});

// Clear logs (dangerous - only for development/maintenance)
router.delete('/', async (req, res, next) => {
  try {
    const { type = 'all' } = req.query;
    const logsDir = path.join(__dirname, '../../logs');
    
    const filesToClear: string[] = [];
    
    if (type === 'all' || type === 'combined') {
      filesToClear.push('combined.log');
    }
    
    if (type === 'all' || type === 'error') {
      filesToClear.push('error.log');
    }
    
    for (const file of filesToClear) {
      const filePath = path.join(logsDir, file);
      try {
        await fs.writeFile(filePath, '');
      } catch (error) {
        logger.error(`Failed to clear log file ${file}:`, error);
      }
    }
    
    logger.info('Logs cleared', { type, clearedFiles: filesToClear });
    
    res.json({
      message: 'Logs cleared successfully',
      clearedFiles: filesToClear,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
