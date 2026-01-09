import { Router, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import MoneyOut from '../models/MoneyOut.model';
import BitExpense from "./BeatExpense.model';
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

    console.log('=== Fetching All Transactions ===');
    console.log('Date Filter:', dateFilter);
    console.log('Type Filter:', type);
    console.log('Period:', period);

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

      console.log(`Found ${moneyInRecords.length} Money In transactions`);

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

      console.log(`Found ${moneyOutRecords.length} Money Out transactions`);

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

    // 3. BEAT Expenses
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
          { beatName: { $regex: search, $options: 'i' } },
          { locationName: { $regex: search, $options: 'i' } }
        ];
      }

      const bitExpenses = await BitExpense.find(bitExpenseQuery)
        .populate('addedBy', 'firstName lastName')
        .lean();

      console.log(`Found ${bitExpenses.length} BEAT Expenses`);

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
          location: record.locationName || record.beatName || 'N/A',
          createdAt: record.createdAt
        });
      });
    }

    // 4. Salaries
    if (!type || type === 'all' || type === 'salary') {
      const salaryQuery: any = { 
        isDeleted: false
      };
      
      // Include PENDING, APPROVED, and PAID salaries
      if (!type || type === 'all') {
        // For "all transactions" view, show all statuses
        salaryQuery.status = { $in: ['PENDING', 'APPROVED', 'PAID'] };
      } else {
        // For salary-specific filter, show only approved/paid
        salaryQuery.status = { $in: ['APPROVED', 'PAID'] };
      }
      
      // Apply date filter to paidAt or createdAt
      if (Object.keys(dateFilter).length > 0) {
        salaryQuery.$or = [
          { paidAt: dateFilter },
          { createdAt: dateFilter }
        ];
      }
      
      if (search) {
        salaryQuery.workerName = { $regex: search, $options: 'i' };
      }

      console.log('Salary Query:', JSON.stringify(salaryQuery, null, 2));
      
      const salaries = await Salary.find(salaryQuery)
        .populate('worker', 'firstName lastName')
        .populate('paidBy', 'firstName lastName')
        .lean();

      console.log(`Found ${salaries.length} salaries`);

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
          recordedBy: record.paidBy ? `${record.paidBy.firstName} ${record.paidBy.lastName}` : 'SYSTEM',
          status: record.status,
          location: 'N/A',
          createdAt: record.createdAt
        });
      });
    }

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`=== TOTAL TRANSACTIONS: ${allTransactions.length} ===`);
    console.log('Breakdown:');
    console.log('- Money In:', allTransactions.filter(t => t.type === 'MONEY_IN').length);
    console.log('- Money Out:', allTransactions.filter(t => t.type === 'MONEY_OUT').length);
    console.log('- BEAT Expenses:', allTransactions.filter(t => t.type === 'BIT_EXPENSE').length);
    console.log('- Salaries:', allTransactions.filter(t => t.type === 'SALARY').length);

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
 * AI-Powered Financial Suggestions (Simple & Clear for Everyone)
 * Explains finances in plain English that anyone can understand
 */
function generateFinancialSuggestions(metrics: any): string[] {
  const suggestions: string[] = [];
  const expenseRatio = metrics.totalIncome > 0 ? metrics.totalExpenses / metrics.totalIncome : 0;
  const profitMargin = metrics.totalIncome > 0 ? (metrics.netCashFlow / metrics.totalIncome) * 100 : 0;

  // ========================================
  // 1. SIMPLE CASH FLOW CHECK
  // ========================================
  if (metrics.netCashFlow < 0) {
    const deficit = Math.abs(metrics.netCashFlow);
    suggestions.push(`🚨 PROBLEM: You're spending ₦${deficit.toLocaleString()} MORE than you're earning. This is like spending more money than your salary - you'll run out soon!\n\nWhat to do NOW:\n• Stop paying for things you don't really need right now\n• Call clients who owe you money and ask them to pay faster\n• Check every payment request carefully before approving`);
  } else if (metrics.netCashFlow > 0 && profitMargin < 10) {
    suggestions.push(`⚠️ BE CAREFUL: You're only keeping ₦${metrics.netCashFlow.toLocaleString()} after paying everything. That's just ${profitMargin.toFixed(0)}% profit - very small!\n\nThink of it like this: If you earn ₦100, you only keep ₦${profitMargin.toFixed(0)} after expenses.\n\nWhat to do:\n• Find ways to spend less money\n• OR find ways to earn more money\n• Target: Keep at least ₦15-20 from every ₦100 you earn`);
  } else if (metrics.netCashFlow > metrics.totalIncome * 0.2) {
    const savingsAmount = metrics.netCashFlow * 0.5;
    suggestions.push(`✅ EXCELLENT! You're keeping ₦${metrics.netCashFlow.toLocaleString()} as profit (${profitMargin.toFixed(0)}% of what you earn). This is VERY GOOD!\n\nSmart things to do with this money:\n• Save ₦${savingsAmount.toLocaleString()} for emergencies (like unexpected repairs)\n• Buy better equipment to work faster\n• Train your staff to work better\n• Give bonuses to hardworking employees`);
  }

  // ========================================
  // 2. HOW MUCH YOU'RE SPENDING
  // ========================================
  if (expenseRatio > 0.90) {
    suggestions.push(`🔴 DANGER: For every ₦100 you earn, you're spending ₦${(expenseRatio * 100).toFixed(0)}! That's almost everything!\n\nImagine: You get ₦100 salary, but ₦${(expenseRatio * 100).toFixed(0)} goes to bills. Only ₦${(100 - expenseRatio * 100).toFixed(0)} left!\n\nEMERGENCY STEPS:\n• Stop all spending that's not absolutely necessary\n• Talk to your suppliers - ask for lower prices\n• Review how many people you're paying - do you need everyone?\n• Set a rule: Need approval before spending more than ₦10,000`);
  } else if (expenseRatio > 0.80 && expenseRatio <= 0.90) {
    suggestions.push(`🟡 WARNING: You're spending ₦${(expenseRatio * 100).toFixed(0)} out of every ₦100 you earn. This is too much!\n\nBetter target: Spend only ₦70-75 out of every ₦100 you earn\n\nHow to improve:\n• Look at your biggest expenses - can you reduce them by 10%?\n• Review what locations/BEATs are spending most money\n• Find cheaper suppliers for things you buy regularly\n• Check if you're wasting anything (fuel, electricity, supplies)`);
  } else if (expenseRatio >= 0.65 && expenseRatio <= 0.80) {
    suggestions.push(`🟢 GOOD: You're spending ₦${(expenseRatio * 100).toFixed(0)} from every ₦100 you earn. This is okay, but can be better!\n\nHow to make it excellent:\n• Buy things in bulk to get discounts (uniforms, equipment)\n• Turn off lights and AC when not needed to save electricity\n• Make sure guards are using fuel wisely\n• Target: Bring spending down to ₦65-70 from every ₦100`);
  } else if (expenseRatio < 0.60 && metrics.totalExpenses > 0) {
    suggestions.push(`⭐ AMAZING! You're only spending ₦${(expenseRatio * 100).toFixed(0)} from every ₦100 you earn. This is excellent money management!\n\nKeep doing what you're doing:\n• Continue checking expenses every month\n• Keep negotiating good prices with suppliers\n• Share your cost-saving tricks with all your locations`);
  }

  // ========================================
  // 3. LOCATION/BEAT EXPENSES (SIMPLE)
  // ========================================
  const bitExpenseRatio = metrics.totalExpenses > 0 ? metrics.bitExpensesTotal / metrics.totalExpenses : 0;
  
  if (bitExpenseRatio > 0.40 && metrics.bitExpensesTotal > 0) {
    const avgPerLocation = Math.round(metrics.bitExpensesTotal / 10);
    suggestions.push(`💡 Your locations (BEATs) are spending A LOT: ₦${metrics.bitExpensesTotal.toLocaleString()} total\n\nEach location spends about: ₦${avgPerLocation.toLocaleString()}\n\nCheck these:\n• Which location spends the most? Why?\n• Are they buying things at good prices?\n• Can you buy uniforms/equipment for ALL locations together (cheaper)?\n• Are they using too much fuel for vehicles?\n• Set a spending limit for each location`);
  } else if (bitExpenseRatio > 0.25 && bitExpenseRatio <= 0.40 && metrics.bitExpensesTotal > 0) {
    suggestions.push(`📊 Your locations are spending ₦${metrics.bitExpensesTotal.toLocaleString()}. This is normal.\n\nWays to spend less:\n• Buy supplies for all locations at once (get bulk discount)\n• Fix equipment regularly so it doesn't break (cheaper than buying new)\n• Share good ideas between locations - if one is saving money, others can copy`);
  }

  // ========================================
  // 4. SALARY COSTS (SIMPLE)
  // ========================================
  const salaryRatio = metrics.totalExpenses > 0 ? metrics.salariesTotal / metrics.totalExpenses : 0;
  
  if (salaryRatio > 0.55 && metrics.salariesTotal > 0) {
    suggestions.push(`👥 You're spending ₦${metrics.salariesTotal.toLocaleString()} on salaries - that's MORE THAN HALF of all your expenses!\n\nThis means: For every ₦100 you spend, ₦${(salaryRatio * 100).toFixed(0)} goes to paying staff\n\nThink about:\n• Do you have too many workers for the amount of work?\n• Can some guards work at multiple locations?\n• Are you paying overtime too much? (It's expensive!)\n• Give bonuses for good work instead of just raising salaries`);
  } else if (salaryRatio > 0.35 && salaryRatio <= 0.55 && metrics.salariesTotal > 0) {
    suggestions.push(`👥 Salary spending is ₦${metrics.salariesTotal.toLocaleString()}. This is balanced.\n\nStay balanced by:\n• Making sure each worker is productive (doing good work)\n• Training staff so they work better\n• Checking if overtime is necessary or can be avoided`);
  } else if (salaryRatio > 0 && salaryRatio < 0.30) {
    suggestions.push(`✅ Your salary costs are VERY EFFICIENT! Good job managing your workforce.\n\nKeep your good workers happy:\n• Give small bonuses for excellent performance\n• Provide training to help them grow\n• Happy workers stay longer (saving you hiring costs)`);
  }

  // ========================================
  // 5. INCOME VS EXPENSES (SIMPLE)
  // ========================================
  if (metrics.totalIncome > 0) {
    const extra = metrics.totalIncome - metrics.totalExpenses;
    const extraPercent = (extra / metrics.totalIncome) * 100;
    
    if (extraPercent < 15 && extra >= 0) {
      const needMore = metrics.totalExpenses * 0.25 - extra;
      suggestions.push(`📈 You need to earn MORE money! Right now, you only keep ₦${extra.toLocaleString()} extra.\n\nWhy this matters: If clients pay late or you have emergency, you're in trouble!\n\nHow to earn more money:\n• Talk to current clients - can you guard more places for them?\n• Find 2-3 new clients\n• Check your prices - are they too low? When did you last increase them?\n• Target: Earn at least ₦${needMore.toLocaleString()} more per month`);
    } else if (extraPercent >= 15 && extraPercent < 25) {
      suggestions.push(`📊 You're keeping ₦${extra.toLocaleString()} extra (${extraPercent.toFixed(0)}% of income). This is okay!\n\nTo make it better:\n• Focus on keeping current clients happy (easier than finding new ones)\n• Ask clients if they need additional services\n• Check prices every 3 months - adjust if costs go up`);
    }
  }

  // ========================================
  // 6. MONEY OUT ANALYSIS (SIMPLE)
  // ========================================
  if (metrics.moneyOutTotal > metrics.totalExpenses * 0.35) {
    suggestions.push(`💸 You're spending too much on "Money Out" (other expenses): ₦${metrics.moneyOutTotal.toLocaleString()}\n\nWhat is Money Out? Payments for supplies, repairs, transport, etc.\n\nControl this better:\n• Any payment over ₦5,000? Must write down WHY you need it\n• Any payment over ₦25,000? Must get 2 managers to approve\n• Review all "Money Out" every month - where is money going?\n• Some expenses happen every month? Plan for them in budget`);
  }

  // ========================================
  // 7. RECORD KEEPING (SIMPLE)
  // ========================================
  if (metrics.transactionCount < 20) {
    suggestions.push(`📊 You only have ${metrics.transactionCount} transactions recorded. This seems LOW.\n\nWhy this matters: If you don't write down all money coming in and going out, you can't know if you're making or losing money!\n\nMake sure you record:\n• EVERY money you receive from clients (with receipt)\n• EVERY expense at locations/BEATs\n• ALL salary payments\n• Train everyone: "No payment without recording it"\n• Check records every week - don't wait until month end`);
  }

  // ========================================
  // 8. PROFIT CHECK (SIMPLE)
  // ========================================
  if (profitMargin >= 15 && profitMargin < 25 && metrics.netCashFlow > 0) {
    suggestions.push(`💰 You're keeping ${profitMargin.toFixed(0)}% profit - this is GOOD for security business!\n\nNormal profit for security companies: 15-25%\n\nSmart moves:\n• Save money equal to 6 months of expenses (for emergencies)\n• Invest in better equipment or vehicles\n• Consider sharing profits with hardworking staff (keeps them motivated)`);
  } else if (profitMargin >= 25) {
    suggestions.push(`🏆 WOW! ${profitMargin.toFixed(0)}% profit - this is EXCELLENT!\n\nYou have options:\n• Your prices might be high - consider small reduction to get more clients\n• Invest in growing your business (new locations, more guards)\n• Improve staff benefits (they're making you successful!)\n• Save for big investments (vehicles, office, technology)`);
  } else if (profitMargin > 0 && profitMargin < 10) {
    suggestions.push(`⚠️ Your profit is only ${profitMargin.toFixed(0)}% - this is TOO LOW!\n\nWhat this means: You're barely making money. One problem and you could lose money!\n\n90-DAY PLAN:\n• First 2 weeks: Find expenses you can cut (target: save 15%)\n• Next 2 weeks: Review client prices - can you increase by 8-10%?\n• Next month: Start changes, track if improving\n• Last month: Measure results - aim for 15% profit`);
  }

  // ========================================
  // 9. EMERGENCY SAVINGS (SIMPLE)
  // ========================================
  if (metrics.netCashFlow > 0 && metrics.netCashFlow < metrics.totalExpenses * 0.25) {
    const needToSave = metrics.totalExpenses * 0.25 - metrics.netCashFlow;
    suggestions.push(`🏦 IMPORTANT: You need an EMERGENCY FUND (savings for problems)\n\nRight now, you should have: ₦${(metrics.totalExpenses * 0.25).toLocaleString()} saved (3 months of expenses)\n\nYou need: ₦${needToSave.toLocaleString()} more\n\nWhy? If client doesn't pay on time, or vehicle breaks down, or equipment needs replacement - you have money to handle it!\n\nHow: Save a bit from every payment you receive until you reach the target.`);
  }

  // ========================================
  // 10. SIMPLE SUMMARY
  // ========================================
  suggestions.push(`💼 SIMPLE SUMMARY:\n\n• For every ₦100 you earn, you keep ₦${profitMargin.toFixed(0)} profit\n• You spend ₦${(expenseRatio * 100).toFixed(0)} on expenses from every ₦100 earned\n• Salary costs take ₦${(salaryRatio * 100).toFixed(0)} from every ₦100 you spend\n\nCheck these numbers every month - are they getting better or worse?\n\nTIP: Have a meeting every 3 months with your managers to discuss money matters.`);

  // Return top 6-7 most relevant suggestions
  return suggestions.slice(0, 7);
}

export default router;
