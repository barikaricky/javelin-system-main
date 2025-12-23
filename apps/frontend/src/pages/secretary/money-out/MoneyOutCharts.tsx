import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MoneyOutChartsProps {
  records: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MoneyOutCharts: React.FC<MoneyOutChartsProps> = ({ records }) => {
  const formatCurrency = (value: number) => {
    return `₦${(value / 1000).toFixed(0)}k`;
  };

  // Category breakdown
  const categoryData = records.reduce((acc: any[], record: any) => {
    const existing = acc.find(item => item.name === record.category);
    if (existing) {
      existing.value += record.amount;
    } else {
      acc.push({
        name: record.category.replace(/_/g, ' '),
        value: record.amount
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Status breakdown
  const statusData = records.reduce((acc: any[], record: any) => {
    const existing = acc.find(item => item.name === record.approvalStatus);
    if (existing) {
      existing.value += record.amount;
      existing.count += 1;
    } else {
      acc.push({
        name: record.approvalStatus.replace(/_/g, ' '),
        value: record.amount,
        count: 1
      });
    }
    return acc;
  }, []);

  // Top 5 beneficiaries
  const beneficiaryData = records
    .reduce((acc: any[], record: any) => {
      const existing = acc.find(item => item.name === record.beneficiaryName);
      if (existing) {
        existing.value += record.amount;
      } else {
        acc.push({
          name: record.beneficiaryName,
          value: record.amount
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-sm">{payload[0].name}</p>
          <p className="text-blue-600 font-bold">
            ₦{payload[0].value.toLocaleString()}
          </p>
          {payload[0].payload.count && (
            <p className="text-xs text-gray-600">{payload[0].payload.count} records</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Money Out Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Category</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name.substring(0, 15)}...`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Status</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Beneficiaries */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Top 5 Beneficiaries</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={beneficiaryData} layout="horizontal">
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MoneyOutCharts;
