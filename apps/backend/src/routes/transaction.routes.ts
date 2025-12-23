import { Router } from 'express';
import * as transactionService from '../services/transaction.service';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create transaction
router.post('/', asyncHandler(async (req: any, res) => {
  const transaction = await transactionService.createTransaction(req.body, req.user.userId);
  res.status(201).json(transaction);
}));

// Get all transactions
router.get('/', asyncHandler(async (req: any, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await transactionService.getAllTransactions(
    filters,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 50
  );
  res.json(result);
}));

// Get transaction stats
router.get('/stats', asyncHandler(async (req: any, res) => {
  const { startDate, endDate } = req.query;
  const stats = await transactionService.getTransactionStats(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  res.json(stats);
}));

// Get daily transaction log
router.get('/daily/:date', asyncHandler(async (req: any, res) => {
  const log = await transactionService.getDailyTransactionLog(new Date(req.params.date));
  res.json(log);
}));

// Get monthly transaction log
router.get('/monthly/:year/:month', asyncHandler(async (req: any, res) => {
  const log = await transactionService.getMonthlyTransactionLog(
    parseInt(req.params.year),
    parseInt(req.params.month)
  );
  res.json(log);
}));

// Get transaction categories
router.get('/categories', asyncHandler(async (req: any, res) => {
  const categories = await transactionService.getTransactionCategories();
  res.json(categories);
}));

// Get transaction by ID
router.get('/:id', asyncHandler(async (req: any, res) => {
  const transaction = await transactionService.getTransactionById(req.params.id);
  res.json(transaction);
}));

// Update transaction
router.put('/:id', asyncHandler(async (req: any, res) => {
  const transaction = await transactionService.updateTransaction(req.params.id, req.body);
  res.json(transaction);
}));

// Delete transaction
router.delete('/:id', asyncHandler(async (req: any, res) => {
  const result = await transactionService.deleteTransaction(req.params.id);
  res.json(result);
}));

export default router;
