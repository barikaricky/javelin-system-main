import { Router, Request } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { 
  createExpense, 
  getExpenses, 
  getExpenseById, 
  updateExpense, 
  deleteExpense,
  approveExpense,
  getExpenseStats,
  getExpensesByLocation,
  getLocationExpenseBreakdown,
  exportExpenses
} from '../services/expense.service';

const router = Router();

router.use(authenticate);

// Get expense statistics (Directors and Secretaries only)
router.get('/stats', authorize('DIRECTOR', 'SECRETARY'), async (req, res, next) => {
  try {
    const stats = await getExpenseStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Create expense
router.post('/', authorize('DIRECTOR', 'SUPERVISOR', 'SECRETARY'), async (req: Request & { user?: any }, res, next) => {
  try {
    const userId = req.user!.userId;
    const expense = await createExpense(userId, req.body);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// Get all expenses with filters
router.get('/', async (req: Request & { user?: any }, res, next) => {
  try {
    const { status, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filters = {
      status: status as string,
      category: category as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      userId: req.user!.role === 'OPERATOR' ? req.user!.userId : undefined,
    };
    
    const expenses = await getExpenses(filters);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get expense by ID
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id);
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Update expense
router.patch('/:id', authorize('DIRECTOR', 'SECRETARY'), async (req, res, next) => {
  try {
    const expense = await updateExpense(req.params.id, req.body);
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Approve/Reject expense
router.post('/:id/approve', authorize('DIRECTOR', 'SECRETARY'), async (req: Request & { user?: any }, res, next) => {
  try {
    const userId = req.user!.userId;
    const { approved, notes } = req.body;
    const expense = await approveExpense(req.params.id, userId, approved, notes);
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', authorize('DIRECTOR'), async (req, res, next) => {
  try {
    await deleteExpense(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get expenses by location
router.get('/by-location', authorize('DIRECTOR', 'SECRETARY'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await getExpensesByLocation(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// Get detailed breakdown for a specific location
router.get('/location/:locationId/breakdown', authorize('DIRECTOR', 'SECRETARY'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const breakdown = await getLocationExpenseBreakdown(
      req.params.locationId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(breakdown);
  } catch (error) {
    next(error);
  }
});

// Export expenses to CSV
router.get('/export', authorize('DIRECTOR', 'SECRETARY'), async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const result = await exportExpenses(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      format as string
    );
    
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${Date.now()}.${format}`);
    res.send(result);
  } catch (error) {
    next(error);
  }
});

export default router;
