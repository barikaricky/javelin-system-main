import { useAuthStore } from '../../stores/authStore';

export default function OperatorDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Operator Dashboard
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Welcome back, <span className="text-yellow-600 font-semibold">{user?.firstName}!</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <p className="text-gray-600">Operator features coming soon...</p>
      </div>
    </div>
  );
}
