import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';

// Components
import AdminTabs from '../components/admin/AdminTabs';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePortfolio();
  const navigate = useNavigate();

  // Redirect if not logged in as admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">
          Manage positions, settings, and generate reports
        </p>
      </div>

      <AdminTabs />
    </div>
  );
};

export default AdminPage;
