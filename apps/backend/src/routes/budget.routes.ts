import { Router } from 'express';
import * as budgetService from '../services/budget.service';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create budget
router.post('/', asyncHandler(async (req: any, res) => {
  const budget = await budgetService.createBudget(req.body, req.user.userId);
  res.status(201).json(budget);
}));

// Get all budgets
router.get('/', asyncHandler(async (req: any, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await budgetService.getAllBudgets(
    filters,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 50
  );
  res.json(result);
}));

// Get budget by ID
router.get('/:id', asyncHandler(async (req: any, res) => {
  const budget = await budgetService.getBudgetById(req.params.id);
  res.json(budget);
}));

// Get budget vs spending analysis
router.get('/:id/vs-spending', asyncHandler(async (req: any, res) => {
  const analysis = await budgetService.getBudgetVsSpending(req.params.id);
  res.json(analysis);
}));

// Update budget
router.put('/:id', asyncHandler(async (req: any, res) => {
  const budget = await budgetService.updateBudget(req.params.id, req.body);
  res.json(budget);
}));

// Approve budget
router.patch('/:id/approve', asyncHandler(async (req: any, res) => {
  const budget = await budgetService.approveBudget(req.params.id, req.user.userId);
  res.json(budget);
}));

// Update budget spending
router.patch('/:id/spending', asyncHandler(async (req: any, res) => {
  const budget = await budgetService.updateBudgetSpending(
    req.params.id,
    req.body.categoryName,
    req.body.amount
  );
  res.json(budget);
}));

// Delete budget
router.delete('/:id', asyncHandler(async (req: any, res) => {
  const result = await budgetService.deleteBudget(req.params.id);
  res.json(result);
}));

export default router;
