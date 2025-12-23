import { useState, useEffect } from 'react';
import { Bug, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import axios from 'axios';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://cautious-potato-v49974jqgqx2pvv7-3002.app.github.dev';

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    const results: TestResult[] = [];

    // Test 1: Check Frontend Environment
    results.push({
      name: 'Frontend Environment',
      status: 'success',
      message: `Running on ${window.location.origin}`,
      details: {
        origin: window.location.origin,
        protocol: window.location.protocol,
        host: window.location.host,
      }
    });
    setTests([...results]);

    // Test 2: Check API Base URL
    results.push({
      name: 'API Configuration',
      status: 'success',
      message: `API Base URL: ${API_BASE}`,
      details: {
        apiBaseUrl: API_BASE,
        envVar: import.meta.env.VITE_API_URL,
      }
    });
    setTests([...results]);

    // Test 3: Simple Fetch to Backend Health
    try {
      const response = await fetch(`${API_BASE}/api/health`, {
        method: 'GET',
        mode: 'cors',
      });
      const data = await response.json();
      results.push({
        name: 'Backend Health Check',
        status: 'success',
        message: `Backend is responding (${response.status})`,
        details: {
          status: response.status,
          data,
          headers: Object.fromEntries(response.headers.entries()),
        }
      });
    } catch (error: any) {
      results.push({
        name: 'Backend Health Check',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTests([...results]);

    // Test 4: CORS Preflight Request
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization',
        },
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      };

      results.push({
        name: 'CORS Preflight Request',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'CORS headers present' : 'CORS headers missing',
        details: {
          status: response.status,
          corsHeaders,
          allHeaders: Object.fromEntries(response.headers.entries()),
        }
      });
    } catch (error: any) {
      results.push({
        name: 'CORS Preflight Request',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTests([...results]);

    // Test 5: Axios Request to Login Endpoint
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'test@example.com',
        password: 'test123',
      }, {
        withCredentials: true,
      });
      
      results.push({
        name: 'Axios POST Request',
        status: 'warning',
        message: 'Request succeeded (credentials invalid)',
        details: response.data,
      });
    } catch (error: any) {
      if (error.response) {
        results.push({
          name: 'Axios POST Request',
          status: error.response.status === 401 ? 'warning' : 'error',
          message: error.response.status === 401 
            ? 'Endpoint reachable (401 expected for invalid credentials)'
            : `Server error: ${error.response.status}`,
          details: {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        });
      } else if (error.request) {
        results.push({
          name: 'Axios POST Request',
          status: 'error',
          message: 'No response from server (CORS or network issue)',
          details: {
            error: error.message,
            request: error.request,
          }
        });
      } else {
        results.push({
          name: 'Axios POST Request',
          status: 'error',
          message: error.message,
          details: error,
        });
      }
    }
    setTests([...results]);

    // Test 6: Check LocalStorage
    const token = localStorage.getItem('token');
    results.push({
      name: 'LocalStorage Token',
      status: token ? 'success' : 'warning',
      message: token ? 'Token found in localStorage' : 'No token in localStorage',
      details: { token: token ? '***' + token.slice(-10) : null }
    });
    setTests([...results]);

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-600" />
            Debug & Diagnostics
          </h1>
          <p className="text-gray-600 mt-2">
            Testing API connectivity and CORS configuration
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Bug className="w-5 h-5" />
                Run Diagnostics
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={index}
              className={`${getStatusBg(test.status)} border-2 rounded-xl p-6 transition-all`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {test.name}
                  </h3>
                  <p className="text-gray-700 mt-1">{test.message}</p>
                  
                  {test.details && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded-lg text-xs overflow-x-auto border border-gray-200">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {tests.length > 0 && !isRunning && (
          <div className="mt-6 bg-white rounded-xl p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">
                  {tests.filter(t => t.status === 'warning').length}
                </div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Fixes */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-3">💡 Quick Fixes</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Make sure backend server is running on port 3002</li>
            <li>• Check that CORS is configured to allow your frontend origin</li>
            <li>• Verify the API_BASE_URL in your .env file</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Try accessing the health endpoint directly: {API_BASE}/api/health</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
