import { Router, Request, Response } from 'express';
import Report from '../models/Report';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/reports/analytics - Get comprehensive analytics
router.get('/analytics', authenticate, asyncHandler(async (req: any, res: Response) => {
  const { days = 30, locationId } = req.query;
  
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - parseInt(days as string));

  const matchQuery: any = { createdAt: { $gte: dateLimit } };
  if (locationId) {
    matchQuery.locationId = locationId;
  }

  // Total reports
  const totalReports = await Report.countDocuments(matchQuery);

  // Reports by status
  const byStatus = await Report.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusCounts = byStatus.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Reports by type
  const byType = await Report.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$reportType', count: { $sum: 1 } } },
  ]);
  const typeCounts = byType.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Reports by priority
  const byPriority = await Report.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);
  const priorityCounts = byPriority.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Reports by location
  const byLocation = await Report.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'locations',
        localField: 'locationId',
        foreignField: '_id',
        as: 'location',
      },
    },
    { $unwind: { path: '$location', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$location.locationName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const locationCounts = byLocation.map((item: any) => ({
    name: item._id,
    count: item.count,
  }));

  // Reports by BEAT
  const byBIT = await Report.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'beats',
        localField: 'beatId',
        foreignField: '_id',
        as: 'bit',
      },
    },
    { $unwind: { path: '$bit', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$bit.beatName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const bitCounts = byBIT.map((item: any) => ({
    name: item._id,
    count: item.count,
  }));

  // Reports by supervisor
  const bySupervisor = await Report.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: 'supervisors',
        localField: 'supervisorId',
        foreignField: '_id',
        as: 'supervisor',
      },
    },
    { $unwind: { path: '$supervisor', preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: 'users',
        localField: 'supervisor.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const supervisorCounts = bySupervisor.map((item: any) => ({
    name: item._id,
    count: item.count,
  }));

  // Recent activity (daily counts)
  const recentActivity = await Report.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const activityData = recentActivity.map((item: any) => ({
    date: item._id,
    count: item.count,
  }));

  // Average response time (hours from creation to approval) - Enhanced calculation
  const approvedReports = await Report.find({
    ...matchQuery,
    status: 'APPROVED',
    approvedAt: { $exists: true, $ne: null },
    createdAt: { $exists: true, $ne: null },
  }).select('createdAt approvedAt submittedAt');

  let avgResponseTime = 0;
  if (approvedReports.length > 0) {
    const validReports = approvedReports.filter(
      report => 
        report.approvedAt && 
        report.createdAt && 
        new Date(report.approvedAt).getTime() > new Date(report.createdAt).getTime()
    );

    if (validReports.length > 0) {
      const totalTime = validReports.reduce((sum, report) => {
        // Use submittedAt if available, otherwise use createdAt
        const startTime = report.submittedAt || report.createdAt;
        const endTime = report.approvedAt!;
        const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);
      avgResponseTime = Math.round((totalTime / validReports.length) * 10) / 10; // Round to 1 decimal
    }
  }

  // Approval rate
  const approvedCount = statusCounts.APPROVED || 0;
  const rejectedCount = statusCounts.REJECTED || 0;
  const totalProcessed = approvedCount + rejectedCount;
  const approvalRate = totalProcessed > 0 ? (approvedCount / totalProcessed) * 100 : 0;

  // Trends (compare with previous period)
  const previousDateLimit = new Date(dateLimit);
  previousDateLimit.setDate(previousDateLimit.getDate() - parseInt(days as string));
  const previousMatchQuery = {
    ...matchQuery,
    createdAt: { $gte: previousDateLimit, $lt: dateLimit },
  };
  const reportsLastPeriod = await Report.countDocuments(previousMatchQuery);
  const percentageChange =
    reportsLastPeriod > 0 ? ((totalReports - reportsLastPeriod) / reportsLastPeriod) * 100 : 0;

  res.json({
    success: true,
    analytics: {
      totalReports,
      byStatus: statusCounts,
      byType: typeCounts,
      byPriority: priorityCounts,
      byLocation: locationCounts,
      byBIT: bitCounts,
      bySupervisor: supervisorCounts,
      recentActivity: activityData,
      avgResponseTime,
      approvalRate,
      trends: {
        reportsThisMonth: totalReports,
        reportsLastMonth: reportsLastPeriod,
        percentageChange,
      },
    },
  });
}));

// GET /api/reports/analytics/export - Export analytics as PDF
router.get('/analytics/export', authenticate, asyncHandler(async (req: any, res: Response) => {
  // TODO: Implement PDF export of analytics
  res.status(501).json({ message: 'Analytics export not yet implemented' });
}));

export default router;
