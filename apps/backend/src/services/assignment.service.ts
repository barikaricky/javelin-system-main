import mongoose from 'mongoose';
import { GuardAssignment, IGuardAssignment } from '../models/GuardAssignment.model';
import { Operator } from '../models/Operator.model';
import { Bit } from '../models/Bit.model';
import { Supervisor } from '../models/Supervisor.model';
import User from '../models/User.model';
import * as activityService from './activity.service';
import * as notificationService from './notification.service';

export class AssignmentService {
  /**
   * Create a new guard assignment
   * Auto-determines approval status based on assignedBy role:
   * - Manager: ACTIVE immediately
   * - General Supervisor: ACTIVE immediately
   * - Supervisor: PENDING (requires GS approval)
   */
  async createAssignment(data: {
    operatorId: string;
    bitId: string;
    supervisorId: string;
    shiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
    startDate: Date;
    endDate?: Date;
    assignmentType?: 'PERMANENT' | 'TEMPORARY' | 'RELIEF';
    specialInstructions?: string;
    allowances?: Array<{ type: string; amount: number; reason: string }>;
    assignedBy: { userId: string; role: string; name: string };
  }): Promise<IGuardAssignment> {
    // Validate operator exists and is ACTIVE
    const operator = await Operator.findById(data.operatorId).populate('userId');
    if (!operator) {
      throw new Error('Operator not found');
    }
    if ((operator.userId as any).status !== 'ACTIVE') {
      throw new Error('Operator must be ACTIVE to be assigned to a BIT');
    }

    // Check for existing active or pending assignment
    const existingAssignment = await GuardAssignment.findOne({
      operatorId: data.operatorId,
      status: { $in: ['ACTIVE', 'PENDING'] },
    });
    if (existingAssignment) {
      throw new Error('Operator already has an active or pending assignment');
    }

    // Validate BIT exists and is active
    const bit = await Bit.findById(data.bitId);
    if (!bit) {
      throw new Error('BIT not found');
    }
    if (!bit.isActive) {
      throw new Error('Cannot assign guards to inactive BIT');
    }

    // Check BIT capacity
    const activeAssignmentsCount = await GuardAssignment.countDocuments({
      bitId: data.bitId,
      status: 'ACTIVE',
    });
    if (activeAssignmentsCount >= bit.numberOfOperators) {
      // Warning only - allow Manager to exceed
      if (data.assignedBy.role !== 'MANAGER' && data.assignedBy.role !== 'DIRECTOR') {
        throw new Error(
          `BIT has reached capacity (${bit.numberOfOperators} operators). Contact Manager to assign more guards.`
        );
      }
    }

    // Validate supervisor
    const supervisor = await Supervisor.findById(data.supervisorId);
    if (!supervisor) {
      throw new Error('Supervisor not found');
    }

    // Get location from BIT
    const locationId = bit.locationId;
    if (!locationId) {
      throw new Error('BIT must have a location assigned');
    }

    // Determine initial status based on role
    let status: 'PENDING' | 'ACTIVE' = 'PENDING';
    if (
      data.assignedBy.role === 'MANAGER' ||
      data.assignedBy.role === 'GENERAL_SUPERVISOR' ||
      data.assignedBy.role === 'DIRECTOR'
    ) {
      status = 'ACTIVE';
    }

    // Create assignment
    const assignment = new GuardAssignment({
      operatorId: data.operatorId,
      bitId: data.bitId,
      locationId,
      supervisorId: data.supervisorId,
      assignmentType: data.assignmentType || 'PERMANENT',
      shiftType: data.shiftType,
      startDate: data.startDate,
      endDate: data.endDate,
      status,
      assignedBy: data.assignedBy,
      specialInstructions: data.specialInstructions,
      allowances: data.allowances,
    });

    await assignment.save();

    // Update operator's locationId
    operator.locationId = locationId as any;
    await operator.save();

    // Log activity
    await activityService.logActivity(
      data.assignedBy.userId,
      'GUARD_ASSIGNED',
      'GuardAssignment',
      assignment._id.toString(),
      {
        operatorId: data.operatorId,
        operatorName: `${(operator.userId as any).firstName} ${(operator.userId as any).lastName}`,
        bitId: data.bitId,
        bitName: bit.bitName,
        status,
        shiftType: data.shiftType,
      }
    );

    // Populate for notifications and return
    const populatedAssignment = await GuardAssignment.findById(assignment._id)
      .populate({
        path: 'operatorId',
        populate: { path: 'userId' },
      })
      .populate('bitId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      })
      .lean() as IGuardAssignment;

    // Send notifications after populating (don't let notification errors break assignment)
    try {
      if (status === 'ACTIVE') {
        await this.notifyAssignmentActive(populatedAssignment);
      } else if (status === 'PENDING') {
        await this.notifyAssignmentPending(populatedAssignment);
      }
    } catch (notificationError) {
      console.error('Failed to send assignment notification:', notificationError);
      // Continue anyway - assignment was successful
    }

    return populatedAssignment;
  }

  /**
   * Approve a pending assignment (General Supervisor only)
   */
  async approveAssignment(
    assignmentId: string,
    approvedBy: { userId: string; role: string; name: string }
  ): Promise<IGuardAssignment> {
    const assignment = await GuardAssignment.findById(assignmentId)
      .populate({
        path: 'operatorId',
        populate: { path: 'userId' },
      })
      .populate('bitId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== 'PENDING') {
      throw new Error('Only pending assignments can be approved');
    }

    // Update status
    assignment.status = 'ACTIVE';
    assignment.approvedBy = approvedBy;
    assignment.approvedAt = new Date();
    await assignment.save();

    // Log activity
    await activityService.logActivity(
      approvedBy.userId,
      'ASSIGNMENT_APPROVED',
      'GuardAssignment',
      assignmentId,
      {
        operatorId: assignment.operatorId._id.toString(),
        operatorName: `${(assignment.operatorId as any).userId.firstName} ${(assignment.operatorId as any).userId.lastName}`,
        bitId: assignment.bitId._id.toString(),
        bitName: (assignment.bitId as any).bitName,
      }
    );

    // Notify relevant parties
    await this.notifyAssignmentApproved(assignment);

    return assignment;
  }

  /**
   * Reject a pending assignment
   */
  async rejectAssignment(
    assignmentId: string,
    rejectionReason: string,
    rejectedBy: { userId: string; role: string; name: string }
  ): Promise<IGuardAssignment> {
    const assignment = await GuardAssignment.findById(assignmentId)
      .populate({
        path: 'operatorId',
        populate: { path: 'userId' },
      })
      .populate('bitId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== 'PENDING') {
      throw new Error('Only pending assignments can be rejected');
    }

    assignment.status = 'REJECTED';
    assignment.rejectionReason = rejectionReason;
    assignment.approvedBy = rejectedBy;
    assignment.approvedAt = new Date();
    await assignment.save();

    // Log activity
    await activityService.logActivity(
      rejectedBy.userId,
      'ASSIGNMENT_REJECTED',
      'GuardAssignment',
      assignmentId,
      {
        operatorId: assignment.operatorId._id.toString(),
        operatorName: `${(assignment.operatorId as any).userId.firstName} ${(assignment.operatorId as any).userId.lastName}`,
        bitId: assignment.bitId._id.toString(),
        bitName: (assignment.bitId as any).bitName,
        reason: rejectionReason,
      }
    );

    // Notify requester
    await this.notifyAssignmentRejected(assignment);

    return assignment;
  }

  /**
   * Transfer operator from one BIT to another
   * Ends current assignment and creates new one
   */
  async transferOperator(data: {
    operatorId: string;
    newBitId: string;
    newSupervisorId: string;
    newShiftType: 'DAY' | 'NIGHT' | '24_HOURS' | 'ROTATING';
    transferDate: Date;
    transferReason: string;
    assignedBy: { userId: string; role: string; name: string };
  }): Promise<IGuardAssignment> {
    // Find current active assignment
    const currentAssignment = await GuardAssignment.findOne({
      operatorId: data.operatorId,
      status: 'ACTIVE',
    });

    if (!currentAssignment) {
      throw new Error('No active assignment found for this operator');
    }

    // End current assignment
    currentAssignment.status = 'TRANSFERRED';
    currentAssignment.endDate = data.transferDate;
    currentAssignment.transferReason = data.transferReason;
    await currentAssignment.save();

    // Create new assignment
    const newAssignment = await this.createAssignment({
      operatorId: data.operatorId,
      bitId: data.newBitId,
      supervisorId: data.newSupervisorId,
      shiftType: data.newShiftType,
      startDate: data.transferDate,
      assignmentType: 'PERMANENT',
      assignedBy: data.assignedBy,
    });

    // Link to previous assignment
    await GuardAssignment.findByIdAndUpdate(newAssignment._id, {
      replacesAssignmentId: currentAssignment._id,
      transferReason: data.transferReason,
    });

    // Log activity
    await activityService.logActivity(
      data.assignedBy.userId,
      'GUARD_TRANSFERRED',
      'GuardAssignment',
      newAssignment._id.toString(),
      {
        operatorId: data.operatorId,
        oldBitId: currentAssignment.bitId.toString(),
        newBitId: data.newBitId,
        reason: data.transferReason,
      }
    );

    return newAssignment;
  }

  /**
   * End an active assignment
   */
  async endAssignment(
    assignmentId: string,
    endDate: Date,
    endReason: string,
    endedBy: { userId: string; role: string; name: string }
  ): Promise<IGuardAssignment> {
    const assignment = await GuardAssignment.findById(assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== 'ACTIVE') {
      throw new Error('Only active assignments can be ended');
    }

    assignment.status = 'ENDED';
    assignment.endDate = endDate;
    assignment.specialInstructions = `${assignment.specialInstructions || ''}\nEnd reason: ${endReason}`.trim();
    await assignment.save();

    // Log activity
    await activityService.logActivity(
      endedBy.userId,
      'ASSIGNMENT_ENDED',
      'GuardAssignment',
      assignmentId,
      {
        operatorId: assignment.operatorId.toString(),
        bitId: assignment.bitId.toString(),
        reason: endReason,
        endDate,
      }
    );

    return assignment;
  }

  /**
   * Get operator's active assignment
   */
  async getOperatorActiveAssignment(operatorId: string): Promise<IGuardAssignment | null> {
    return await GuardAssignment.findOne({
      operatorId,
      status: 'ACTIVE',
      $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: new Date() } }],
    })
      .populate({
        path: 'operatorId',
        populate: { path: 'userId' },
      })
      .populate('bitId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      });
  }

  /**
   * Get all assignments for a BIT
   */
  async getBitAssignments(bitId: string, status?: string): Promise<IGuardAssignment[]> {
    const query: any = { bitId };
    if (status) {
      query.status = status;
    }

    return await GuardAssignment.find(query)
      .populate({
        path: 'operatorId',
        populate: { path: 'userId', select: 'firstName lastName email phone profilePhoto state' },
      })
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId', select: 'firstName lastName email phone' },
      })
      .populate('locationId')
      .populate('bitId')
      .sort({ startDate: -1 });
  }

  /**
   * Get operator assignment history
   */
  async getOperatorHistory(operatorId: string): Promise<IGuardAssignment[]> {
    return await GuardAssignment.find({ operatorId })
      .populate('bitId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      })
      .sort({ startDate: -1 });
  }

  /**
   * Get pending assignments for General Supervisor approval
   */
  async getPendingAssignmentsForGS(generalSupervisorId: string): Promise<IGuardAssignment[]> {
    // Find supervisors under this GS
    const supervisors = await Supervisor.find({ generalSupervisorId });
    const supervisorIds = supervisors.map((s) => s._id);

    return await GuardAssignment.find({
      status: 'PENDING',
      supervisorId: { $in: supervisorIds },
    })
      .populate({
        path: 'operatorId',
        populate: { path: 'userId' },
      })
      .populate('bitId')
      .populate('locationId')
      .populate({
        path: 'supervisorId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Validate operator eligibility for assignment
   */
  async validateOperatorEligibility(operatorId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const operator = await Operator.findById(operatorId).populate('userId');
    
    if (!operator) {
      return { eligible: false, reason: 'Operator not found' };
    }

    if ((operator.userId as any).status !== 'ACTIVE') {
      return { eligible: false, reason: 'Operator is not in ACTIVE status' };
    }

    const existingAssignment = await GuardAssignment.findOne({
      operatorId,
      status: { $in: ['ACTIVE', 'PENDING'] },
    });

    if (existingAssignment) {
      return { eligible: false, reason: 'Operator already has an active or pending assignment' };
    }

    return { eligible: true };
  }

  /**
   * Notification helpers
   */
  private async notifyAssignmentActive(assignment: IGuardAssignment) {
    const operator = assignment.operatorId as any;
    const bit = assignment.bitId as any;
    
    // Safely get operator userId
    const operatorUserId = operator?.userId?._id || operator?.userId;
    if (!operatorUserId) {
      console.warn('Cannot send notification: operator userId not found');
      return;
    }
    
    await notificationService.sendNotification({
      recipientId: operatorUserId.toString(),
      title: 'New Assignment',
      message: `You have been assigned to ${bit?.bitName || 'a BIT'}. Your shift starts on ${new Date(assignment.startDate).toLocaleDateString()}.`,
      type: 'ASSIGNMENT',
      priority: 'HIGH',
    });
  }

  private async notifyAssignmentPending(assignment: IGuardAssignment) {
    // Notify General Supervisor about pending assignment
    const supervisor = assignment.supervisorId as any;
    if (supervisor?.generalSupervisorId) {
      const gs = await Supervisor.findById(supervisor.generalSupervisorId).populate('userId');
      if (gs) {
        const gsUserId = (gs.userId as any)?._id || gs.userId;
        if (gsUserId) {
          await notificationService.sendNotification({
            recipientId: gsUserId.toString(),
            title: 'Assignment Awaiting Approval',
            message: `New assignment request from ${assignment.assignedBy.name} needs your approval.`,
            type: 'ASSIGNMENT',
            priority: 'MEDIUM',
          });
        }
      }
    }
  }

  private async notifyAssignmentApproved(assignment: IGuardAssignment) {
    const operator = assignment.operatorId as any;
    const bit = assignment.bitId as any;
    
    const operatorUserId = operator?.userId?._id || operator?.userId;
    if (operatorUserId) {
      // Notify operator
      await notificationService.sendNotification({
        recipientId: operatorUserId.toString(),
        title: 'Assignment Approved',
        message: `Your assignment to ${bit?.bitName || 'a BIT'} has been approved. Your shift starts on ${new Date(assignment.startDate).toLocaleDateString()}.`,
        type: 'ASSIGNMENT',
        priority: 'HIGH',
      });
    }

    // Notify requester
    if (assignment.assignedBy?.userId) {
      await notificationService.sendNotification({
        recipientId: assignment.assignedBy.userId.toString(),
        title: 'Assignment Approved',
        message: `Your assignment request has been approved by ${assignment.approvedBy?.name}.`,
        type: 'ASSIGNMENT',
        priority: 'MEDIUM',
      });
    }
  }

  private async notifyAssignmentRejected(assignment: IGuardAssignment) {
    // Notify requester
    await notificationService.sendNotification({
      recipientId: assignment.assignedBy.userId.toString(),
      title: 'Assignment Rejected',
      message: `Your assignment request was rejected. Reason: ${assignment.rejectionReason}`,
      type: 'ASSIGNMENT',
      priority: 'HIGH',
    });
  }

  /**
   * Update an existing guard assignment
   */
  async updateAssignment(assignmentId: string, updates: Partial<IGuardAssignment>): Promise<IGuardAssignment> {
    const assignment = await GuardAssignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Update fields
    Object.assign(assignment, updates);
    await assignment.save();

    // Populate for return
    await assignment.populate([
      { path: 'operatorId', populate: { path: 'userId' } },
      { path: 'bitId' },
      { path: 'locationId' },
      { path: 'supervisorId', populate: { path: 'userId' } },
    ]);

    return assignment;
  }

  /**
   * Delete/cancel an assignment
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    const assignment = await GuardAssignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Update status to ENDED instead of deleting
    assignment.status = 'ENDED';
    assignment.endDate = new Date();
    await assignment.save();
  }
}

export const assignmentService = new AssignmentService();
 
