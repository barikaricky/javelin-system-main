import { useEffect, useState } from 'react';
import { PieChart, TrendingUp, MapPin } from 'lucide-react';
import { api } from '../../lib/api';

interface LocationExpense {
  locationId: string | null;
  locationName: string;
  region: string | null;
  amount: number;
  count: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
  count: number;
}

export default function ExpenseAnalytics() {
  const [locationData, setLocationData] = useState<LocationExpense[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [locationsRes, categoriesRes] = await Promise.all([
        api.get('/expenses/by-location'),
        api.get('/expenses/by-category'),
      ]);

      setLocationData(locationsRes.data);
      setCategoryData(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = locationData.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
  const maxLocationAmount = Math.max(...locationData.map(item => parseFloat(item.amount.toString())), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location-Based Expenses */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Expenses by Location</h3>
        </div>

        {locationData.length > 0 ? (
          <div className="space-y-3">
            {locationData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{item.locationName}</span>
                    {item.region && (
                      <span className="text-gray-500 ml-2">({item.region})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">₦{parseFloat(item.amount.toString()).toLocaleString()}</span>
                    <span className="text-gray-500 ml-2">({item.count} transactions)</span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(parseFloat(item.amount.toString()) / maxLocationAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No location data available</p>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-secondary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
        </div>

        {categoryData.length > 0 ? (
          <div className="space-y-3">
            {categoryData.map((item, index) => {
              const percentage = totalExpenses > 0 ? (parseFloat(item.amount.toString()) / totalExpenses) * 100 : 0;
              const colors = [
                'from-blue-400 to-blue-600',
                'from-green-400 to-green-600',
                'from-yellow-400 to-yellow-600',
                'from-purple-400 to-purple-600',
                'from-pink-400 to-pink-600',
                'from-red-400 to-red-600',
                'from-indigo-400 to-indigo-600',
                'from-orange-400 to-orange-600',
              ];
              const color = colors[index % colors.length];

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{item.category.replace('_', ' ')}</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">₦{parseFloat(item.amount.toString()).toLocaleString()}</span>
                      <span className="text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No category data available</p>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4 sm:p-6 border-2 border-primary-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary-700" />
          <h4 className="font-semibold text-gray-900">Summary</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">₦{totalExpenses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {locationData.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Active Locations</p>
            <p className="text-2xl font-bold text-gray-900">{locationData.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
