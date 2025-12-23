import { Router } from 'express';
import * as clientService from '../services/client.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create client
router.post('/', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  logger.info('Create client request', { userId: req.user.userId });
  const client = await clientService.createClient(req.body, req.user.userId);
  res.status(201).json({ message: 'Client created successfully', client });
}));

// Get all clients
router.get('/', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await clientService.getAllClients(
    filters,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 50
  );
  res.json(result);
}));

// Get client stats
router.get('/stats', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  const stats = await clientService.getClientStats();
  res.json(stats);
}));

// Get client by ID
router.get('/:id', asyncHandler(async (req: any, res) => {
  const client = await clientService.getClientById(req.params.id);
  res.json(client);
}));

// Get client payment history
router.get('/:id/payment-history', asyncHandler(async (req: any, res) => {
  const history = await clientService.getClientPaymentHistory(req.params.id);
  res.json(history);
}));

// Update client
router.put('/:id', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  const client = await clientService.updateClient(req.params.id, req.body, req.user.userId);
  res.json({ message: 'Client updated successfully', client });
}));

// Assign guard to client
router.post('/:id/assign-guard', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  const { operatorId, supervisorId, postType } = req.body;
  const client = await clientService.assignGuardToClient(
    req.params.id,
    operatorId,
    supervisorId,
    postType,
    req.user.userId
  );
  res.json({ message: 'Guard assigned successfully', client });
}));

// Remove guard from client
router.delete('/:id/remove-guard/:operatorId', authorize('SECRETARY', 'DIRECTOR', 'MANAGER'), asyncHandler(async (req: any, res) => {
  const client = await clientService.removeGuardFromClient(
    req.params.id,
    req.params.operatorId,
    req.user.userId
  );
  res.json({ message: 'Guard removed successfully', client });
}));

// Delete client
router.delete('/:id', authorize('DIRECTOR'), asyncHandler(async (req: any, res) => {
  const result = await clientService.deleteClient(req.params.id);
  res.json(result);
}));

export default router;
