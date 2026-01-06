import { Router, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import MoneyOut from '../models/MoneyOut.model';
import BitExpense from '../models/BitExpense.model';
import { Salary } from '../models/Salary.model';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/all-transactions
 * Get all financial transactions across the system
 * Combines: MoneyIn, MoneyOut, BitExpenses, Salaries
 * Access: Director, Manager
 */
router.get(
  '/',
  authorize('DIRECTOR', 'MANAGER'),
  asyncHandler(async (req: any, res: Response) => {
    const {
      startDate,
      endDate,
      type, // 'all', 'money_in', 'money_out', 'bit_expense', 'salary'
      period = 'month', // 'week', 'month', 'year', 'all'
      page = '1',
      limit = '50',
      search
    } = req.query;

    // Calculate date range based on period
    let dateFilter: any = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { $gte: weekAgo, $lte: now };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { $gte: monthAgo, $lte: now };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { $gte: yearAgo, $lte: now };
    } else if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Fetch all transaction types
    const allTransactions = [];

    // 1. Money In transactions
    if (!type || type === 'all' || type === 'money_in') {
      const moneyInQuery: any = { 
        transactionType: 'MONEY_IN',
        deletedAt: null
      };
      if (Object.keys(dateFilter).length > 0) {
        moneyInQuery.transactionDate = dateFilter;
      }
      if (search) {
        moneyInQuery.$or = [
          { description: { $regex: search, $options: 'i' } },
          { referenceNumber: { $regex: search, $options: 'i' } },
          { receiptNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const moneyInRecords = await Transaction.find(moneyInQuery)
        .populate('clientId', 'clientName companyName')
        .populate('recordedById', 'firstName lastName')
        .lean();

      moneyInRecords.forEach((record: any) => {
        allTransactions.push({
          _id: record._id,
          type: 'MONEY_IN',
          category: record.source || 'MISCELLANEOUS',
          description: record.description,
          amount: record.amount,
          date: record.transactionDate,
          paymentMethod: record.paymentMethod,
          referenceNumber: record.referenceNumber,
          beneficiary: record.clientId ? (record.clientId.companyName || record.clientId.clientName) : 'N/A',
          recordedBy: record.recordedById ? `${record.recordedById.firstName} ${record.recordedById.lastName}` : 'Unknown',
          status: 'RECEIVED',
          location: 'HEAD OFFICE',
          createdAt: record.createdAt
        });
      });
    }

    // 2. Money Out transactions
    if (!type || type === 'all' || type === 'money_out') {
      const moneyOutQuery: any = { 
        isDeleted: false
      };
      if (Object.keys(dateFilter).length > 0) {
        moneyOutQuery.paymentDate = dateFilter;
      }
      if (search) {
        moneyOutQuery.$or = [
          { purpose: { $regex: search, $options: 'i' } },
          { beneficiaryName: { $regex: search, $options: 'i' } }
        ];
      }

      const moneyOutRecords = await MoneyOut.find(moneyOutQuery)
        .populate('requestedById', 'firstName lastName')
        .lean();

      moneyOutRecords.forEach((record: any) => {
        allTransactions.push({
          _id: record._id,
          type: 'MONEY_OUT',
          category: record.category,
          description: record.purpose,
          amount: -record.amount, // Negative for outgoing
          date: record.paymentDate,
          paymentMethod: record.paymentMethod,
          referenceNumber: record._id.toString().slice(-8).toUpperCase(),
          beneficiary: record.beneficiaryName,
          recordedBy: record.requestedById ? `${record.requestedById.firstName} ${record.requestedById.lastName}` : 'Unknown',
          status: record.approvalStatus,
          location: 'HEAD OFFICE',
          createdAt: record.createdAt
        });
      });
    }

    // 3. BIT Expenses
    if (!type || type === 'all' || type === 'bit_expense') {
      const bitExpenseQuery: any = { 
        isDeleted: false
      };
      if (Object.keys(dateFilter).length > 0) {
        bitExpenseQuery.dateIncurred = dateFilter;
      }
      if (search) {
        bitExpenseQuery.$or = [
          { description: { $regex: search, $options: 'i' } },
          { bitName: { $regex: search, $options: 'i' } },
          { locationName: { $regex: search, $options: 'i' } }
        ];
      }

      const bitExpenses = await BitExpense.find(bitExpenseQuery)
        .populate('addedBy', 'firstName lastName')
        .lean();

      bitExpenses.forEach((record: any) => {
        allTransactions.push({
          _id: record._id,
          type: 'BIT_EXPENSE',
          category: record.category,
          description: record.description,
          amount: -record.amount, // Negative for expenses
          date: record.dateIncurred,
          paymentMethod: record.paymentMethod,
          referenceNumber: record._id.toString().slice(-8).toUpperCase(),
          beneficiary: record.clientName || 'UNALLOCATED',
          recordedBy: record.addedByName,
          status: 'PAID',
          location: record.locationName || record.bitName || 'N/A',
          createdAt: record.createdAt
        });
      });
    }

    // 4. Salaries
    if (!type || type === 'all' || type === 'salary') {
      const salaryQuery: any = { 
        status: { $in: ['APPROVED', 'PAID'] }
      };
      if (Object.keys(dateFilter).length > 0) {
        // For salaries, use the payment period
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        salaryQuery.$or = [
          { year, month },
          { paidAt: dateFilter }
        ];
      }
      if (search) {
        salaryQuery.$or = [
          { workerName: { $regex: search, $options: 'i' } }
        ];
      }

      const salaries = await Salary.find(salaryQuery)
        .populate('worker', 'firstName lastName')
        .populate('processedBy', 'firstName lastName')
        .lean();

      salaries.forEach((record: any) => {
        allTransactions.push({
          _id: record._id,
          type: 'SALARY',
          category: 'PERSONNEL',
          description: `Salary - ${record.workerName} (${record.month}/${record.year})`,
          amount: -record.netSalary, // Negative for expenses
          date: record.paidAt || new Date(record.year, record.month - 1, 25),
          paymentMethod: record.paymentMethod || 'BANK_TRANSFER',
          referenceNumber: record._id.toString().slice(-8).toUpperCase(),
          beneficiary: record.workerName,
          recordedBy: record.processedBy ? `${record.processedBy.firstName} ${record.processedBy.lastName}` : 'SYSTEM',
          status: record.status,
          location: 'N/A',
          createdAt: record.createdAt
        });
      });
    }

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    // Calculate summaries
    const totalIncome = allTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(allTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    const netCashFlow = totalIncome - totalExpenses;

    // Calculate by type
    const moneyInTotal = allTransactions
      .filter(t => t.type === 'MONEY_IN')
      .reduce((sum, t) => sum + t.amount, 0);

    const moneyOutTotal = Math.abs(allTransactions
      .filter(t => t.type === 'MONEY_OUT')
      .reduce((sum, t) => sum + t.amount, 0));

    const bitExpensesTotal = Math.abs(allTransactions
      .filter(t => t.type === 'BIT_EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0));

    const salariesTotal = Math.abs(allTransactions
      .filter(t => t.type === 'SALARY')
      .reduce((sum, t) => sum + t.amount, 0));

    // AI-powered suggestions (rule-based)
    const suggestions = generateFinancialSuggestions({
      totalIncome,
      totalExpenses,
      netCashFlow,
      moneyInTotal,
      moneyOutTotal,
      bitExpensesTotal,
      salariesTotal,
      transactionCount: allTransactions.length
    });

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        summary: {
          totalIncome,
          totalExpenses,
          netCashFlow,
          netWorth: netCashFlow, // Simplified net worth calculation
          byType: {
            moneyIn: moneyInTotal,
            moneyOut: moneyOutTotal,
            bitExpenses: bitExpensesTotal,
            salaries: salariesTotal
          },
          count: allTransactions.length
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: allTransactions.length,
          pages: Math.ceil(allTransactions.length / limitNum)
        },
        suggestions
      }
    });
  })
);

/**
 * AI-Powered Financial Suggestions (Advanced Rule-Based System)
 * Acts as a professional accountant analyzing company finances
 */
function generateFinancialSuggestions(metrics: any): string[] {
  const suggestions: string[] = [];
  const expenseRatio = metrics.totalIncome > 0 ? metrics.totalExpenses / metrics.totalIncome : 0;
  const profitMargin = metrics.totalIncome > 0 ? (metrics.netCashFlow / metrics.totalIncome) * 100 : 0;

  // ========================================
  // 1. CRITICAL CASH FLOW ANALYSIS
  // ========================================
  if (metrics.netCashFlow < 0) {
    const deficit = Math.abs(metrics.netCashFlow);
    const monthsToBreakdown = metrics.totalIncome > 0 ? (deficit / (metrics.totalIncome * 0.1)) : 0;
    suggestions.push(`🚨 URGENT: Negative cash flow of ₦${deficit.toLocaleString()}. At current burn rate, sustainability risk in ${Math.ceil(monthsToBreakdown)} months. Immediate action required: 1) Delay non-critical expenses 2) Accelerate receivables collection 3) Review all Money Out approvals.`);
  } else if (metrics.netCashFlow > 0 && metrics.netCashFlow < metrics.totalIncome * 0.1) {
    suggestions.push(`⚠️ Low profit margin (${profitMargin.toFixed(1)}%). Company operating near break-even. Recommendation: Analyze top 3 expense categories and negotiate 10-15% cost reductions. Consider price adjustments for services.`);
  } else if (metrics.netCashFlow > metrics.totalIncome * 0.3) {
    const investmentPotential = metrics.netCashFlow * 0.6;
    suggestions.push(`✅ Excellent profitability! ${profitMargin.toFixed(1)}% profit margin. Suggested allocation: Reserve ₦${investmentPotential.toLocaleString()} (60%) for: 1) Equipment upgrades 2) Emergency fund (3 months operating expenses) 3) Staff training programs.`);
  }

  // ========================================
  // 2. EXPENSE RATIO & OPERATIONAL EFFICIENCY
  // ========================================
  if (expenseRatio > 0.95) {
    suggestions.push(`🔴 CRITICAL: Expense ratio at ${(expenseRatio * 100).toFixed(1)}%. Operating expenses consuming almost all revenue. IMMEDIATE ACTIONS: 1) Freeze all non-essential Money Out requests 2) Renegotiate supplier contracts 3) Review personnel costs 4) Implement expense approval threshold of ₦10,000.`);
  } else if (expenseRatio > 0.85 && expenseRatio <= 0.95) {
    suggestions.push(`🟡 High expense ratio (${(expenseRatio * 100).toFixed(1)}%). Profit margin too thin for sustainability. Focus areas: 1) Reduce BIT operational costs by 10% 2) Review salary-to-revenue ratio 3) Eliminate redundant expenses 4) Target 75% expense ratio within 2 months.`);
  } else if (expenseRatio >= 0.70 && expenseRatio <= 0.85) {
    suggestions.push(`🟢 Moderate expense ratio (${(expenseRatio * 100).toFixed(1)}%). Healthy operational efficiency but room for improvement. Optimize: 1) Consolidate BIT supply purchases 2) Review utility costs 3) Implement bulk purchasing for uniforms/equipment. Target: Reduce to 65-70% within quarter.`);
  } else if (expenseRatio < 0.60 && metrics.totalExpenses > 0) {
    suggestions.push(`⭐ Outstanding cost control! ${(expenseRatio * 100).toFixed(1)}% expense ratio demonstrates excellent financial management. Maintain by: 1) Monthly expense reviews 2) Continue vendor negotiations 3) Share best practices with all BIT locations.`);
  }

  // ========================================
  // 3. BIT EXPENSES DEEP ANALYSIS
  // ========================================
  const bitExpenseRatio = metrics.totalExpenses > 0 ? metrics.bitExpensesTotal / metrics.totalExpenses : 0;
  const bitPercentage = (bitExpenseRatio * 100).toFixed(1);
  
  if (bitExpenseRatio > 0.45) {
    const avgPerBit = metrics.bitExpensesTotal / 10; // Assuming ~10 BITs
    suggestions.push(`💡 BIT expenses are ${bitPercentage}% of total costs (₦${metrics.bitExpensesTotal.toLocaleString()}). Average per location: ₦${avgPerBit.toLocaleString()}/period. HIGH PRIORITY: 1) Audit top 3 spending locations 2) Standardize equipment procurement 3) Implement location expense caps 4) Review fuel/transport efficiency.`);
  } else if (bitExpenseRatio > 0.30 && bitExpenseRatio <= 0.45) {
    suggestions.push(`📊 BIT operational costs at ${bitPercentage}% of expenses. Consider: 1) Centralize purchasing for 10-15% bulk discounts 2) Implement preventive maintenance to reduce repairs 3) Review uniform replacement cycles 4) Share cost-saving practices between locations.`);
  } else if (bitExpenseRatio > 0 && bitExpenseRatio <= 0.20) {
    suggestions.push(`✅ Excellent BIT cost control at ${bitPercentage}%. Operations running efficiently. Maintain by: 1) Document current best practices 2) Regular expense monitoring 3) Proactive maintenance schedules 4) Continue supervisor training on cost management.`);
  }

  // ========================================
  // 4. PERSONNEL COSTS & WORKFORCE OPTIMIZATION
  // ========================================
  const salaryRatio = metrics.totalExpenses > 0 ? metrics.salariesTotal / metrics.totalExpenses : 0;
  const salaryToRevenueRatio = metrics.totalIncome > 0 ? metrics.salariesTotal / metrics.totalIncome : 0;
  const salaryPercentage = (salaryRatio * 100).toFixed(1);
  
  if (salaryRatio > 0.60) {
    suggestions.push(`👥 Personnel costs at ${salaryPercentage}% of expenses (₦${metrics.salariesTotal.toLocaleString()}). Labor-intensive operation detected. Optimization strategies: 1) Review staff-to-contract ratio 2) Implement performance-based compensation 3) Cross-train operators for flexibility 4) Consider variable staffing for peak periods.`);
  } else if (salaryRatio > 0.45 && salaryRatio <= 0.60) {
    suggestions.push(`👥 Salary costs at ${salaryPercentage}% of expenses. Balanced but monitor closely. Actions: 1) Ensure productivity metrics justify headcount 2) Review overtime patterns 3) Consider productivity bonuses vs base salary increases 4) Project next quarter staffing needs.`);
  } else if (salaryRatio > 0 && salaryRatio < 0.30 && salaryToRevenueRatio < 0.20) {
    suggestions.push(`✅ Optimal personnel cost ratio at ${salaryPercentage}%. Efficient workforce utilization. Opportunity: Invest ${(metrics.salariesTotal * 0.05).toLocaleString()} (5% of salary budget) in: 1) Skills training 2) Performance incentives 3) Staff retention programs to maintain quality.`);
  }

  // ========================================
  // 5. REVENUE GROWTH & SUSTAINABILITY
  // ========================================
  const revenueBuffer = metrics.totalIncome - metrics.totalExpenses;
  const bufferPercentage = metrics.totalIncome > 0 ? (revenueBuffer / metrics.totalIncome) * 100 : 0;
  
  if (bufferPercentage < 15 && metrics.totalIncome > 0) {
    const targetRevenue = metrics.totalExpenses * 1.25; // 25% buffer
    const revenueGap = targetRevenue - metrics.totalIncome;
    suggestions.push(`📈 Revenue buffer only ${bufferPercentage.toFixed(1)}% above expenses. Risk: Vulnerable to income fluctuations. GROWTH STRATEGY: Increase revenue by ₦${revenueGap.toLocaleString()} (${((revenueGap/metrics.totalIncome)*100).toFixed(1)}%) through: 1) Pursue 2-3 new contracts 2) Upsell existing clients on additional security services 3) Review pricing - last increase analysis.`);
  } else if (bufferPercentage >= 15 && bufferPercentage < 25) {
    suggestions.push(`📊 Revenue buffer at ${bufferPercentage.toFixed(1)}%. Adequate but not optimal. Target: 25-30% buffer. Strategies: 1) Client retention program (5% increase in retention = 25% profit boost) 2) Expand service offerings 3) Quarterly price reviews 4) Invoice promptly - reduce receivables days.`);
  }

  // ========================================
  // 6. CASH FLOW PATTERN ANALYSIS
  // ========================================
  const moneyOutRatio = metrics.totalExpenses > 0 ? metrics.moneyOutTotal / metrics.totalExpenses : 0;
  
  if (moneyOutRatio > 0.40) {
    suggestions.push(`💸 High discretionary spending detected: Money Out is ${(moneyOutRatio * 100).toFixed(1)}% of expenses (₦${metrics.moneyOutTotal.toLocaleString()}). Recommendation: 1) Require detailed justification for amounts >₦5,000 2) Implement 2-level approval for >₦25,000 3) Monthly Money Out category review 4) Identify recurring expenses for budget allocation.`);
  }

  // ========================================
  // 7. TRANSACTION VOLUME & RECORDING HEALTH
  // ========================================
  if (metrics.transactionCount < 15) {
    suggestions.push(`📊 Low transaction count (${metrics.transactionCount} records). Data integrity concern: 1) Verify all Money In recorded with receipts 2) Confirm all BIT expenses captured 3) Review salary processing completeness 4) Train staff on transaction recording requirements 5) Weekly transaction audits.`);
  } else if (metrics.transactionCount > 100) {
    const avgTransactionSize = (metrics.totalIncome + metrics.totalExpenses) / metrics.transactionCount;
    suggestions.push(`📈 High transaction volume (${metrics.transactionCount} entries). Average transaction: ₦${avgTransactionSize.toLocaleString()}. Efficiency opportunity: 1) Categorize and analyze transaction patterns 2) Consider batching small expenses 3) Implement automated recurring entry templates 4) Monthly reconciliation reviews.`);
  }

  // ========================================
  // 8. PROFITABILITY BENCHMARKS
  // ========================================
  if (profitMargin >= 20 && profitMargin < 30) {
    suggestions.push(`💰 Strong ${profitMargin.toFixed(1)}% profit margin. Industry standard: 15-25% for security services. Recommendation: Maintain quality while: 1) Building 6-month emergency reserve (₦${(metrics.totalExpenses * 0.5).toLocaleString()}) 2) Investing in growth initiatives 3) Considering staff profit-sharing program.`);
  } else if (profitMargin >= 30) {
    suggestions.push(`🏆 Exceptional ${profitMargin.toFixed(1)}% profit margin! Above industry standard (15-25%). Strategic options: 1) Competitive pricing review to gain market share 2) Investment in technology/equipment 3) Expansion to new territories 4) Enhanced employee benefits for retention 5) Dividend consideration for stakeholders.`);
  } else if (profitMargin < 5 && profitMargin >= 0) {
    suggestions.push(`⚠️ Thin ${profitMargin.toFixed(1)}% profit margin. Vulnerability alert: 90-day action plan needed: 1) WEEK 1-2: Expense audit - identify 15% cuts 2) WEEK 3-4: Client pricing review - target 8-10% increase 3) WEEK 5-8: Implement efficiency measures 4) WEEK 9-12: Track improvements. Target: 15% margin in 90 days.`);
  }

  // ========================================
  // 9. WORKING CAPITAL RECOMMENDATIONS
  // ========================================
  const workingCapitalTarget = metrics.totalExpenses * 0.25; // 3 months of expenses
  if (metrics.netCashFlow > 0 && metrics.netCashFlow < workingCapitalTarget) {
    const shortfall = workingCapitalTarget - metrics.netCashFlow;
    suggestions.push(`🏦 Working Capital: Build emergency reserve to ₦${workingCapitalTarget.toLocaleString()} (3 months expenses). Current shortfall: ₦${shortfall.toLocaleString()}. Strategy: Set aside ${((shortfall/metrics.totalIncome)*100).toFixed(1)}% of monthly revenue until target reached. Protects against: contract delays, unexpected expenses, seasonal fluctuations.`);
  }

  // ========================================
  // 10. SMART ACCOUNTING INSIGHTS
  // ========================================
  suggestions.push(`💼 PROFESSIONAL INSIGHT: Review key ratios monthly - Current period: Gross Margin ${profitMargin.toFixed(1)}%, Operating Expense Ratio ${(expenseRatio*100).toFixed(1)}%, Labor Cost Ratio ${(salaryRatio*100).toFixed(1)}%. Compare to: Previous period, Industry benchmarks (Security: 15-25% margins), Company targets. Schedule quarterly financial review with all department heads.`);

  // Return top 8 most relevant suggestions
  return suggestions.slice(0, 8);
}

export default router;
