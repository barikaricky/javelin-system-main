import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CreditCard, Calendar, Building2, Banknote, DollarSign } from 'lucide-react';

interface MoneyInChartsProps {
  records: any[];
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function MoneyInCharts({ records }: MoneyInChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Process chart data
  const processChartData = () => {
    const sourceMap = new Map<string, number>();
    const paymentMethodMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    const clientMap = new Map<string, number>();

    records.forEach(record => {
      // By source
      const source = record.source || 'Unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + record.amount);

      // By payment method
      const method = record.paymentMethod || 'Unknown';
      paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + record.amount);

      // By month
      const month = new Date(record.transactionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap.set(month, (monthMap.get(month) || 0) + record.amount);

      // By client (top 5)
      if (record.clientId?.clientName) {
        const client = record.clientId.clientName;
        clientMap.set(client, (clientMap.get(client) || 0) + record.amount);
      }
    });

    return {
      bySource: Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byPaymentMethod: Array.from(paymentMethodMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byMonth: Array.from(monthMap.entries()).map(([name, value]) => ({ name, value })),
      byClient: Array.from(clientMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
    };
  };

  const chartData = processChartData();

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No data available for charts</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Mobile-First Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Money by Source - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Money by Source
            </h3>
            <div className="text-xs text-gray-500">
              {chartData.bySource.length} sources
            </div>
          </div>
          
          {/* Chart */}
          <div className="mb-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.bySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.bySource.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {chartData.bySource.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 ml-2">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Money by Payment Method - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-600" />
              Payment Methods
            </h3>
            <div className="text-xs text-gray-500">
              {chartData.byPaymentMethod.length} methods
            </div>
          </div>
          
          {/* Chart */}
          <div className="mb-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.byPaymentMethod}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.byPaymentMethod.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {chartData.byPaymentMethod.map((item: any, index: number) => {
              const icon = 
                item.name === 'CASH' ? <Banknote className="w-3 h-3" /> :
                item.name === 'BANK_TRANSFER' ? <Building2 className="w-3 h-3" /> :
                item.name === 'POS' ? <CreditCard className="w-3 h-3" /> :
                <DollarSign className="w-3 h-3" />;

              return (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0 flex items-center justify-center" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    >
                      <div className="text-white" style={{ transform: 'scale(0.7)' }}>
                        {icon}
                      </div>
                    </div>
                    <span className="text-gray-700 truncate">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-semibold text-gray-900 ml-2">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Trend - Bar Chart (Full Width) */}
      {chartData.byMonth.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-600" />
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                style={{ fontSize: '11px' }} 
                stroke="#6b7280"
              />
              <YAxis 
                style={{ fontSize: '11px' }} 
                stroke="#6b7280"
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Clients - Bar Chart */}
      {chartData.byClient.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-orange-600" />
            Top 5 Clients
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.byClient} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                style={{ fontSize: '11px' }} 
                stroke="#6b7280"
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                style={{ fontSize: '11px' }} 
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
