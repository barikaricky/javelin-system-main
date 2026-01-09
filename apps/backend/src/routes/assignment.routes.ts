import { Router, Request, Response } from 'express';
import { assignmentService } from '../services/assignment.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { User } from '../models/User.model';
import { Beat } from "./Beat.model';
import { Secretary } from '../models/Secretary.model';
import { Supervisor, SupervisorType, ApprovalStatus } from '../models/Supervisor.model';
import { GuardAssignment } from '../models/GuardAssignment.model';

const router = Router();

/**
 * @route   POST /api/assignments
 * @desc    Create a new guard assignment
 * @access  Private (Secretary, Manager, General Supervisor, Supervisor, Director, Developer)
 */
router.post(
  '/',
  authenticate,
  authorize('SECRETARY', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const {
        operatorId,
        beatId,
        supervisorId,
        shiftType,
        startDate,
        endDate,
        assignmentType,
        specialInstructions,
        allowances,
      } = req.body;

      // Validate required fields
      if (!operatorId || !beatId || !supervisorId || !shiftType || !startDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: operatorId, beatId, supervisorId, shiftType, startDate',
        });
      }

      const user = (req as any).user;
      
      // Fetch full user details to get name
      const userDetails = await User.findById(user.userId);
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const assignedBy = {
        userId: user.userId,
        role: user.role,
        name: `${userDetails.firstName} ${userDetails.lastName}`,
      };

      const assignment = await assignmentService.createAssignment({
        operatorId,
        beatId,
        supervisorId,
        shiftType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        assignmentType,
        specialInstructions,
        allowances,
        assignedBy,
      });

      res.status(201).json({
        success: true,
        message:
          assignment.status === 'ACTIVE'
            ? 'Guard assigned successfully'
            : 'Assignment created and awaiting approval',
        assignment,
      });
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create assignment',
      });
    }
  }
);

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments with filters
 * @access  Private (All authenticated users)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    console.log('📋 GET /api/assignments - Manager fetching assignments');
    const { beatId, operatorId, supervisorId, status, startDate, endDate } = req.query;

    const query: any = {};
    if (beatId) query.beatId = beatId;
    if (operatorId) query.operatorId = operatorId;
    if (supervisorId) query.supervisorId = supervisorId;
    if (status) query.status = status;
    if (startDate) query.startDate = { $gte: new Date(startDate as string) };
    if (endDate) query.endDate = { $lte: new Date(endDate as string) };

    console.log('🔍 Query:', query);

    const assignments = await GuardAssignment.find(query)
      .populate({
        path: 'operatorId',
        populate: { path: 'userId', select: 'firstName lastName email phone phoneNumber profilePhoto passportPhoto state status' },
      })
      .populate('beatId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId', select: 'firstName lastName email phone' },
      })
      .sort({ createdAt: -1 });

    console.log('✅ Found assignments:', assignments.length);

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error: any) {
    console.error('❌ Error fetching assignments:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/assignments/pending
 * @desc    Get pending assignments for General Supervisor approval
 * @access  Private (General Supervisor only)
 */
router.get(
  '/pending',
  authenticate,
  authorize('GENERAL_SUPERVISOR', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userRole = user.role;

      let assignments;

      if (userRole === 'DIRECTOR' || userRole === 'DEVELOPER') {
        // Directors see all pending assignments
        assignments = await GuardAssignment.find({ status: 'PENDING' })
          .populate({
            path: 'operatorId',
            populate: { path: 'userId' },
          })
          .populate('beatId')
          .populate('locationId')
          .populate({
            path: 'supervisorId',
            populate: { path: 'userId' },
          })
          .sort({ createdAt: -1 });
      } else {
        // General Supervisors see only their supervisors' pending assignments
        const gs = await Supervisor.findOne({ userId: user.id, supervisorType: 'GENERAL_SUPERVISOR' });

        if (!gs) {
          return res.status(404).json({
            success: false,
            message: 'General Supervisor record not found',
          });
        }

        assignments = await assignmentService.getPendingAssignmentsForGS(gs._id.toString());
      }

      res.json({
        success: true,
        count: assignments.length,
        assignments,
      });
    } catch (error: any) {
      console.error('Error fetching pending assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending assignments',
      });
    }
  }
);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get single assignment details
 * @access  Private (All authenticated users)
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    console.log('📋 GET /api/assignments/:id - Fetching assignment:', req.params.id);
    
    const assignment = await GuardAssignment.findById(req.params.id)
      .populate({
        path: 'operatorId',
        populate: { 
          path: 'userId', 
          select: 'firstName lastName email phone phoneNumber profilePhoto state' 
        },
      })
      .populate('beatId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { 
          path: 'userId', 
          select: 'firstName lastName email phone phoneNumber' 
        },
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    console.log('✅ Assignment found:', {
      id: assignment._id,
      operatorId: assignment.operatorId,
      hasUserId: !!(assignment.operatorId as any)?.userId,
      userPhone: (assignment.operatorId as any)?.userId?.phone,
      userPhoneNumber: (assignment.operatorId as any)?.userId?.phoneNumber,
      userState: (assignment.operatorId as any)?.userId?.state
    });

    res.json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    console.error('❌ Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment',
    });
  }
});

/**
 * @route   PATCH /api/assignments/:id/approve
 * @desc    Approve a pending assignment
 * @access  Private (General Supervisor only)
 */
router.patch(
  '/:id/approve',
  authenticate,
  authorize('GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const approvedBy = {
        userId: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      };

      const assignment = await assignmentService.approveAssignment(req.params.id, approvedBy);

      res.json({
        success: true,
        message: 'Assignment approved successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Error approving assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve assignment',
      });
    }
  }
);

/**
 * @route   PATCH /api/assignments/:id/reject
 * @desc    Reject a pending assignment
 * @access  Private (General Supervisor only)
 */
router.patch(
  '/:id/reject',
  authenticate,
  authorize('GENERAL_SUPERVISOR', 'MANAGER', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
      }

      const user = (req as any).user;
      const rejectedBy = {
        userId: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      };

      const assignment = await assignmentService.rejectAssignment(
        req.params.id,
        rejectionReason,
        rejectedBy
      );

      res.json({
        success: true,
        message: 'Assignment rejected',
        assignment,
      });
    } catch (error: any) {
      console.error('Error rejecting assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject assignment',
      });
    }
  }
);

/**
 * @route   POST /api/assignments/:id/transfer
 * @desc    Transfer operator to a new BEAT
 * @access  Private (Manager, General Supervisor)
 */
router.post(
  '/:id/transfer',
  authenticate,
  authorize('MANAGER', 'GENERAL_SUPERVISOR', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const { newBitId, newSupervisorId, newShiftType, transferDate, transferReason } = req.body;

      if (!newBitId || !newSupervisorId || !newShiftType || !transferDate || !transferReason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields for transfer',
        });
      }

      const currentAssignment = await GuardAssignment.findById(req.params.id);

      if (!currentAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      const user = (req as any).user;
      const assignedBy = {
        userId: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      };

      const newAssignment = await assignmentService.transferOperator({
        operatorId: currentAssignment.operatorId.toString(),
        newBitId,
        newSupervisorId,
        newShiftType,
        transferDate: new Date(transferDate),
        transferReason,
        assignedBy,
      });

      res.json({
        success: true,
        message: 'Operator transferred successfully',
        assignment: newAssignment,
      });
    } catch (error: any) {
      console.error('Error transferring operator:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to transfer operator',
      });
    }
  }
);

/**
 * @route   PATCH /api/assignments/:id/end
 * @desc    End an active assignment
 * @access  Private (Manager, General Supervisor)
 */
router.patch(
  '/:id/end',
  authenticate,
  authorize('MANAGER', 'GENERAL_SUPERVISOR', 'DIRECTOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const { endDate, endReason } = req.body;

      if (!endDate || !endReason) {
        return res.status(400).json({
          success: false,
          message: 'End date and reason are required',
        });
      }

      const user = (req as any).user;
      const endedBy = {
        userId: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      };

      const assignment = await assignmentService.endAssignment(
        req.params.id,
        new Date(endDate),
        endReason,
        endedBy
      );

      res.json({
        success: true,
        message: 'Assignment ended successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Error ending assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to end assignment',
      });
    }
  }
);

/**
 * @route   GET /api/beats/:beatId/assignments
 * @desc    Get all assignments for a specific BEAT
 * @access  Private (All authenticated users)
 */
router.get('/beats/:beatId/assignments', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const assignments = await assignmentService.getBitAssignments(
      req.params.beatId,
      status as string
    );

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error: any) {
    console.error('Error fetching BEAT assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BEAT assignments',
    });
  }
});

/**
 * @route   GET /api/operators/:operatorId/assignments
 * @desc    Get assignment history for an operator
 * @access  Private (All authenticated users)
 */
router.get(
  '/operators/:operatorId/assignments',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const assignments = await assignmentService.getOperatorHistory(req.params.operatorId);

      // Get active assignment
      const activeAssignment = await assignmentService.getOperatorActiveAssignment(
        req.params.operatorId
      );

      res.json({
        success: true,
        activeAssignment,
        history: assignments,
        totalAssignments: assignments.length,
      });
    } catch (error: any) {
      console.error('Error fetching operator assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch operator assignments',
      });
    }
  }
);

/**
 * @route   GET /api/operators/:operatorId/active-assignment
 * @desc    Get operator's current active assignment
 * @access  Private (All authenticated users)
 */
router.get(
  '/operators/:operatorId/active-assignment',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const assignment = await assignmentService.getOperatorActiveAssignment(req.params.operatorId);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'No active assignment found for this operator',
        });
      }

      res.json({
        success: true,
        assignment,
      });
    } catch (error: any) {
      console.error('Error fetching active assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active assignment',
      });
    }
  }
);

/**
 * @route   POST /api/operators/:operatorId/validate-eligibility
 * @desc    Check if operator is eligible for assignment
 * @access  Private (All authenticated users)
 */
router.post(
  '/operators/:operatorId/validate-eligibility',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const result = await assignmentService.validateOperatorEligibility(req.params.operatorId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error validating operator eligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate operator eligibility',
      });
    }
  }
);

/**
 * @route   POST /api/assignments/assign
 * @desc    Assign a guard to a BEAT (simplified endpoint for director)
 * @access  Private (Director, Secretary, Manager, General Supervisor, Developer)
 */
router.post(
  '/assign',
  authenticate,
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER', 'GENERAL_SUPERVISOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const {
        operatorId,
        beatId,
        supervisorId,
        shiftType,
        assignmentType,
        startDate,
      } = req.body;

      // Validate required fields (locationId not needed - gets from BEAT)
      if (!operatorId || !beatId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: operatorId, beatId',
        });
      }

      const user = (req as any).user;

      console.log('🔍 Assignment request user:', user);

      // Fetch BEAT details to resolve supervisor automatically
      const bit = await Beat.findById(beatId).lean();
      if (!bit) {
        return res.status(404).json({
          success: false,
          message: 'Beat not found',
        });
      }

      // Determine supervisor (explicit selection -> BEAT assignment -> fallback supervisor)
      let finalSupervisorId = supervisorId || (bit.supervisorId ? bit.supervisorId.toString() : undefined);
      let supervisorDoc = null;

      console.log('🔍 Supervisor resolution:', {
        explicitSupervisorId: supervisorId,
        bitSupervisorId: bit.supervisorId,
        finalSupervisorId,
        bitLocationId: bit.locationId,
      });

      if (finalSupervisorId) {
        supervisorDoc = await Supervisor.findById(finalSupervisorId).lean();
        console.log('🔍 Supervisor lookup by ID:', {
          supervisorId: finalSupervisorId,
          found: !!supervisorDoc,
          supervisorName: supervisorDoc?.fullName,
        });
      }

      if (!supervisorDoc) {
        console.log('🔍 Searching for fallback supervisor...');
        
        const supervisorQuery: any = {
          approvalStatus: ApprovalStatus.APPROVED,
        };

        if (bit.locationId) {
          supervisorQuery.$or = [
            { locationId: bit.locationId },
            { supervisorType: SupervisorType.GENERAL_SUPERVISOR },
          ];
        } else {
          supervisorQuery.supervisorType = SupervisorType.GENERAL_SUPERVISOR;
        }

        console.log('🔍 Supervisor query:', JSON.stringify(supervisorQuery, null, 2));

        supervisorDoc = await Supervisor.findOne(supervisorQuery)
          .sort({ supervisorType: -1, createdAt: 1 })
          .lean();

        console.log('🔍 Fallback supervisor search result:', {
          found: !!supervisorDoc,
          supervisorId: supervisorDoc?._id,
          supervisorName: supervisorDoc?.fullName,
          supervisorType: supervisorDoc?.supervisorType,
        });

        if (supervisorDoc) {
          finalSupervisorId = supervisorDoc._id.toString();
          console.log('ℹ️  Using fallback supervisor:', {
            supervisorId: finalSupervisorId,
            name: supervisorDoc.fullName,
            type: supervisorDoc.supervisorType,
          });
        }
      }

      if (!supervisorDoc || !finalSupervisorId) {
        return res.status(404).json({
          success: false,
          message: 'No approved supervisor available for this assignment. Please assign a supervisor to the BEAT first.',
        });
      }

      const resolvedSupervisorId = finalSupervisorId.toString();
      
      console.log('✅ Resolved supervisor ID:', {
        resolvedSupervisorId,
        type: typeof resolvedSupervisorId,
        supervisorDoc: supervisorDoc ? { id: supervisorDoc._id, name: supervisorDoc.fullName } : null,
      });

      // Resolve assigning user name/details
      let userDetails = await User.findById(user.userId);
      let userName = '';

      if (!userDetails && user.role === 'SECRETARY') {
        const secretary = await Secretary.findOne({ userId: user.userId }).populate('userId');
        if (secretary && secretary.userId) {
          userDetails = secretary.userId as any;
          userName = secretary.fullName || `${userDetails.firstName} ${userDetails.lastName}`;
        }
      }

      if (!userDetails) {
        console.error('❌ User not found in database:', user.userId);
        userName = user.email || 'Unknown User';
      }

      if (!userName && userDetails) {
        userName = `${userDetails.firstName} ${userDetails.lastName}`;
      }

      const assignedBy = {
        userId: user.userId,
        role: user.role,
        name: userName,
      };

      const assignment = await assignmentService.createAssignment({
        operatorId,
        beatId,
        supervisorId: resolvedSupervisorId,
        shiftType: shiftType || 'DAY',
        startDate: startDate ? new Date(startDate) : new Date(),
        assignmentType: assignmentType || 'PERMANENT',
        assignedBy,
      });

      console.log('✅ Assignment created successfully:', {
        assignmentId: assignment._id,
        operatorId: assignment.operatorId,
        beatId: assignment.beatId,
        supervisorId: assignment.supervisorId,
        status: assignment.status,
      });

      res.status(201).json({
        success: true,
        message: 'Guard assigned successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Error assigning guard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to assign guard',
      });
    }
  }
);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update/reassign a guard assignment
 * @access  Private (Director, Secretary, Manager, General Supervisor, Developer)
 */
router.put(
  '/:id',
  authenticate,
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER', 'GENERAL_SUPERVISOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      const {
        locationId,
        beatId,
        supervisorId,
        shiftType,
        assignmentType,
        startDate,
      } = req.body;

      const user = (req as any).user;
      
      // Fetch the existing assignment
      const existingAssignment = await assignmentService.getAssignmentById(req.params.id);
      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found',
        });
      }

      // Get user details
      const userDetails = await User.findById(user.userId);
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const updatedBy = {
        userId: user.userId,
        role: user.role,
        name: `${userDetails.firstName} ${userDetails.lastName}`,
      };

      // Update the assignment
      const updateData: any = {};
      if (locationId) updateData.locationId = locationId;
      if (beatId) updateData.beatId = beatId;
      if (supervisorId) updateData.supervisorId = supervisorId;
      if (shiftType) updateData.shiftType = shiftType;
      if (assignmentType) updateData.assignmentType = assignmentType;
      if (startDate) updateData.startDate = new Date(startDate);

      const assignment = await assignmentService.updateAssignment(req.params.id, {
        ...updateData,
        approvedBy: updatedBy,
      });

      res.json({
        success: true,
        message: 'Assignment updated successfully',
        assignment,
      });
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update assignment',
      });
    }
  }
);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete/unassign a guard assignment
 * @access  Private (Director, Secretary, Manager, General Supervisor, Developer)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('DIRECTOR', 'SECRETARY', 'MANAGER', 'GENERAL_SUPERVISOR', 'DEVELOPER'),
  async (req: Request, res: Response) => {
    try {
      await assignmentService.deleteAssignment(req.params.id);

      res.json({
        success: true,
        message: 'Guard unassigned successfully',
      });
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unassign guard',
      });
    }
  }
);

export default router;
