import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as emergencyAlertService from '../services/emergencyAlert.service';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/emergency-alerts
 * @desc    Create emergency alert
 * @access  Supervisor, Manager, Director
 */
router.post(
  '/',
  authorize('SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR'),
  async (req: any, res) => {
    try {
      const { title, content, alertType, beatId, locationId, targetRoles, targetUserIds } = req.body;

      if (!title || !content || !alertType) {
        return res.status(400).json({ 
          error: 'Title, content, and alertType are required' 
        });
      }

      const alert = await emergencyAlertService.createEmergencyAlert(
        {
          title,
          content,
          alertType,
          triggeredById: req.user.userId,
          beatId,
          locationId,
          targetRoles,
          targetUserIds,
        },
        req.user.role
      );

      res.status(201).json({ 
        alert,
        message: req.user.role === 'SUPERVISOR' 
          ? 'Emergency alert submitted for approval' 
          : 'Emergency alert sent'
      });
    } catch (error: any) {
      console.error('Error creating emergency alert:', error);
      res.status(500).json({ error: error.message || 'Failed to create emergency alert' });
    }
  }
);

/**
 * @route   GET /api/emergency-alerts
 * @desc    Get emergency alerts with filters
 * @access  Supervisor, GS, Manager, Director
 */
router.get(
  '/',
  authorize('SUPERVISOR', 'GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR'),
  async (req: any, res) => {
    try {
      const { status, beatId, page, limit } = req.query;

      const result = await emergencyAlertService.getEmergencyAlerts(
        req.user.userId,
        req.user.role,
        {
          status,
          beatId,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 50,
        }
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching emergency alerts:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch emergency alerts' });
    }
  }
);

/**
 * @route   GET /api/emergency-alerts/pending-count
 * @desc    Get pending alerts count (for GS dashboard badge)
 * @access  General Supervisor
 */
router.get(
  '/pending-count',
  authorize('GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR'),
  async (req, res) => {
    try {
      const count = await emergencyAlertService.getPendingAlertsCount();
      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching pending count:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch pending count' });
    }
  }
);

/**
 * @route   GET /api/emergency-alerts/:id
 * @desc    Get emergency alert by ID
 * @access  Authenticated
 */
router.get(
  '/:id',
  async (req, res) => {
    try {
      const alert = await emergencyAlertService.getEmergencyAlertById(req.params.id);
      res.json({ alert });
    } catch (error: any) {
      console.error('Error fetching emergency alert:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch emergency alert' });
    }
  }
);

/**
 * @route   POST /api/emergency-alerts/:id/approve
 * @desc    Approve emergency alert
 * @access  General Supervisor, Manager, Director
 */
router.post(
  '/:id/approve',
  authorize('GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR'),
  async (req: any, res) => {
    try {
      const alert = await emergencyAlertService.approveEmergencyAlert(
        req.params.id,
        req.user.userId
      );

      res.json({ 
        alert,
        message: 'Emergency alert approved and sent'
      });
    } catch (error: any) {
      console.error('Error approving emergency alert:', error);
      res.status(500).json({ error: error.message || 'Failed to approve emergency alert' });
    }
  }
);

/**
 * @route   POST /api/emergency-alerts/:id/reject
 * @desc    Reject emergency alert
 * @access  General Supervisor, Manager, Director
 */
router.post(
  '/:id/reject',
  authorize('GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR'),
  async (req: any, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const alert = await emergencyAlertService.rejectEmergencyAlert(
        req.params.id,
        req.user.userId,
        reason
      );

      res.json({ 
        alert,
        message: 'Emergency alert rejected'
      });
    } catch (error: any) {
      console.error('Error rejecting emergency alert:', error);
      res.status(500).json({ error: error.message || 'Failed to reject emergency alert' });
    }
  }
);

/**
 * @route   POST /api/emergency-alerts/:id/acknowledge
 * @desc    Acknowledge emergency alert
 * @access  Authenticated
 */
router.post(
  '/:id/acknowledge',
  async (req: any, res) => {
    try {
      const alert = await emergencyAlertService.acknowledgeEmergencyAlert(
        req.params.id,
        req.user.userId
      );

      res.json({ 
        alert,
        message: 'Emergency alert acknowledged'
      });
    } catch (error: any) {
      console.error('Error acknowledging emergency alert:', error);
      res.status(500).json({ error: error.message || 'Failed to acknowledge emergency alert' });
    }
  }
);

export default router;
