import { Router } from 'express';
import * as invoiceService from '../services/invoice.service';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create invoice
router.post('/', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user.userId);
  res.status(201).json(invoice);
}));

// Get all invoices
router.get('/', asyncHandler(async (req: any, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await invoiceService.getAllInvoices(
    filters,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 50
  );
  res.json(result);
}));

// Get invoice stats
router.get('/stats', asyncHandler(async (req: any, res) => {
  const stats = await invoiceService.getInvoiceStats();
  res.json(stats);
}));

// Get overdue invoices
router.get('/overdue', asyncHandler(async (req: any, res) => {
  const invoices = await invoiceService.getOverdueInvoices();
  res.json(invoices);
}));

// Get client invoice history
router.get('/client/:clientId/history', asyncHandler(async (req: any, res) => {
  const history = await invoiceService.getClientInvoiceHistory(req.params.clientId);
  res.json(history);
}));

// Get invoice by ID
router.get('/:id', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  res.json(invoice);
}));

// Update invoice
router.put('/:id', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  res.json(invoice);
}));

// Mark invoice as sent
router.patch('/:id/send', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.markInvoiceAsSent(req.params.id);
  res.json(invoice);
}));

// Mark invoice as paid
router.patch('/:id/pay', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.markInvoiceAsPaid(req.params.id, req.body);
  res.json(invoice);
}));

// Cancel invoice
router.patch('/:id/cancel', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.cancelInvoice(req.params.id, req.body.reason);
  res.json(invoice);
}));

// Send invoice reminder
router.post('/:id/remind', asyncHandler(async (req: any, res) => {
  const invoice = await invoiceService.sendInvoiceReminder(req.params.id);
  res.json(invoice);
}));

export default router;
