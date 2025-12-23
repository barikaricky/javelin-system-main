import { Client, Transaction, Invoice, Operator, AuditLog } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export async function createClient(data: any, createdById: string) {
  try {
    // Only check for existing email if email is provided
    if (data.email) {
      const existingClient = await Client.findOne({ email: data.email.toLowerCase() });
      if (existingClient) {
        throw new AppError('Client with this email already exists', 409);
      }
    }

    const client = await Client.create({
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
      createdById,
      contractStartDate: new Date(data.contractStartDate),
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
      numberOfGuards: data.numberOfGuards || 0,
      monthlyPayment: data.monthlyPayment || 0,
      assignedGuards: []
    });

    // Log activity
    await AuditLog.create({
      userId: createdById,
      action: 'CLIENT_CREATED',
      resourceType: 'client',
      resourceId: client._id,
      details: {
        clientName: client.clientName,
        companyName: client.companyName,
        email: client.email
      }
    });

    logger.info('Client created', { clientId: client._id });
    return client;
  } catch (error) {
    logger.error('Create client error:', error);
    throw error;
  }
}

export async function getAllClients(filters?: any, page = 1, limit = 50) {
  const where: any = {};

  if (filters?.isActive !== undefined) where.isActive = filters.isActive;
  if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters?.state) where.state = filters.state;
  if (filters?.search) {
    where.$or = [
      { clientName: new RegExp(filters.search, 'i') },
      { companyName: new RegExp(filters.search, 'i') },
      { email: new RegExp(filters.search, 'i') },
    ];
  }

  const [clients, total] = await Promise.all([
    Client.find(where)
      .populate({ path: 'createdById', select: 'firstName lastName' })
      .populate({
        path: 'assignedGuards.operatorId',
        select: 'employeeId fullName phone',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      })
      .populate({
        path: 'assignedGuards.supervisorId',
        select: 'employeeId fullName phone'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Client.countDocuments(where),
  ]);

  return {
    clients,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClientStats() {
  const [total, active, overdueInvoices] = await Promise.all([
    Client.countDocuments(),
    Client.countDocuments({ isActive: true }),
    Invoice.countDocuments({ status: 'OVERDUE' }),
  ]);

  const totalGuardsDeployed = await Client.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: '$numberOfGuards' } } }
  ]);

  const totalMonthlyRevenue = await Client.aggregate([
    { $match: { isActive: true, paymentMethod: 'MONTHLY' } },
    { $group: { _id: null, total: { $sum: '$monthlyPayment' } } }
  ]);

  return { 
    total, 
    active, 
    inactive: total - active, 
    overdueInvoices,
    totalGuardsDeployed: totalGuardsDeployed[0]?.total || 0,
    totalMonthlyRevenue: totalMonthlyRevenue[0]?.total || 0
  };
}

export async function getClientById(clientId: string) {
  try {
    const client = await Client.findById(clientId)
      .populate({
        path: 'assignedGuards.operatorId',
        select: 'employeeId fullName phone email',
        populate: {
          path: 'userId',
          select: 'firstName lastName passportPhoto'
        }
      })
      .populate({
        path: 'assignedGuards.supervisorId',
        select: 'employeeId fullName phone email'
      })
      .populate('createdById', 'firstName lastName email');

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return client;
  } catch (error) {
    logger.error('Get client by ID error:', error);
    throw error;
  }
}

export async function updateClient(clientId: string, data: any, userId: string) {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== client.email) {
      const existingClient = await Client.findOne({ email: data.email });
      if (existingClient) {
        throw new AppError('A client with this email already exists', 400);
      }
    }

    Object.assign(client, data);
    await client.save();

    // Log activity
    await AuditLog.create({
      userId,
      action: 'CLIENT_UPDATED',
      resourceType: 'client',
      resourceId: client._id,
      details: {
        clientName: client.clientName,
        updatedFields: Object.keys(data)
      }
    });

    logger.info('Client updated successfully', { clientId });

    return client;
  } catch (error) {
    logger.error('Update client error:', error);
    throw error;
  }
}

export async function assignGuardToClient(
  clientId: string,
  operatorId: string,
  supervisorId: string | undefined,
  postType: string,
  userId: string
) {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    // Verify operator exists
    const operator = await Operator.findById(operatorId);
    if (!operator) {
      throw new AppError('Operator not found', 404);
    }

    // Check if operator is already assigned
    const alreadyAssigned = client.assignedGuards?.some(
      guard => guard.operatorId.toString() === operatorId
    );

    if (alreadyAssigned) {
      throw new AppError('This guard is already assigned to this client', 400);
    }

    // Add guard assignment
    if (!client.assignedGuards) {
      client.assignedGuards = [];
    }

    client.assignedGuards.push({
      operatorId: new mongoose.Types.ObjectId(operatorId),
      supervisorId: supervisorId ? new mongoose.Types.ObjectId(supervisorId) : undefined,
      assignedDate: new Date(),
      postType
    });

    // Update number of guards
    client.numberOfGuards = client.assignedGuards.length;

    await client.save();

    // Log activity
    await AuditLog.create({
      userId,
      action: 'GUARD_ASSIGNED_TO_CLIENT',
      resourceType: 'client',
      resourceId: client._id,
      details: {
        clientName: client.clientName,
        operatorId,
        postType
      }
    });

    logger.info('Guard assigned to client successfully', { clientId, operatorId });

    return client;
  } catch (error) {
    logger.error('Assign guard to client error:', error);
    throw error;
  }
}

export async function removeGuardFromClient(
  clientId: string,
  operatorId: string,
  userId: string
) {
  try {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    if (!client.assignedGuards) {
      throw new AppError('No guards assigned to this client', 400);
    }

    // Remove guard
    client.assignedGuards = client.assignedGuards.filter(
      guard => guard.operatorId.toString() !== operatorId
    );

    // Update number of guards
    client.numberOfGuards = client.assignedGuards.length;

    await client.save();

    // Log activity
    await AuditLog.create({
      userId,
      action: 'GUARD_REMOVED_FROM_CLIENT',
      resourceType: 'client',
      resourceId: client._id,
      details: {
        clientName: client.clientName,
        operatorId
      }
    });

    logger.info('Guard removed from client successfully', { clientId, operatorId });

    return client;
  } catch (error) {
    logger.error('Remove guard from client error:', error);
    throw error;
  }
}
