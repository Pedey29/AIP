import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import supabaseApi from '../api/supabaseApi';
import Button from '../components/common/Button';

const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setIsAdmin } = usePortfolio();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await supabaseApi.verifyAdminPassword(password);
      
      if (isValid) {
        setIsAdmin(true);
        navigate('/admin');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-600 mt-2">Enter the admin password to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 text-danger-800 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              Log In
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
