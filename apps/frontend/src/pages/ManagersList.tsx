import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { managerApi, Manager } from '../services/api.service';

export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await managerApi.getAll();
      setManagers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch managers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'badge-success',
      inactive: 'badge-error',
      suspended: 'badge-warning',
    };
    return classes[status as keyof typeof classes] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="p-lg flex items-center justify-center h-64">
        <p className="text-lg text-gray-600">Loading managers...</p>
      </div>
    );
  }

  return (
    <div className="p-lg pb-24 lg:pb-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-xl">
        <div>
          <h1 className="text-page-title mb-sm">Managers</h1>
          <p className="text-base text-gray-600">
            Total: {managers.length} managers
          </p>
        </div>
        <Link to="/managers/register" className="btn-primary">
          + Register New Manager
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="badge-error p-lg mb-lg rounded-lg">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Managers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {managers.map((manager) => (
          <div key={manager.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-md">
              <div className="flex-1">
                <h3 className="text-section-header">
                  {manager.firstName} {manager.lastName}
                </h3>
                <p className="text-sm text-gray-600">{manager.role}</p>
              </div>
              <span className={`badge ${getStatusBadge(manager.status)}`}>
                {manager.status}
              </span>
            </div>

            <div className="space-y-sm text-sm">
              <div className="flex items-center gap-sm">
                <span className="text-gray-600">📧</span>
                <span className="text-gray-700">{manager.email}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-gray-600">📱</span>
                <span className="text-gray-700">{manager.phone}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-gray-600">🏢</span>
                <span className="text-gray-700">{manager.department}</span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-gray-600">📅</span>
                <span className="text-gray-700">
                  Started: {new Date(manager.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {managers.length === 0 && !loading && (
        <div className="card text-center py-xl">
          <p className="text-large-number mb-md">📋</p>
          <p className="text-section-header mb-sm">No managers registered yet</p>
          <p className="text-base text-gray-600 mb-lg">
            Start by registering your first manager
          </p>
          <Link to="/managers/register" className="btn-primary inline-block">
            Register First Manager
          </Link>
        </div>
      )}
    </div>
  );
}
