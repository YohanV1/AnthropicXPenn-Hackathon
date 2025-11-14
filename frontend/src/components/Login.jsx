import { useState } from 'react';
import { authAPI } from '../services/api';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.demoLogin();
      localStorage.setItem('token', response.data.token);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoice Insights</h1>
          <p className="text-gray-500 mt-2">AI-Powered Financial Assistant</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Try Demo Login'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Connect to backend at http://localhost:3000
        </p>
      </div>
    </div>
  );
}
