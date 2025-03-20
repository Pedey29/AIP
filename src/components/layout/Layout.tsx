import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

// Components
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { loading } = usePortfolio();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="container mx-auto">
              {children}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white p-4 border-t border-gray-200 text-sm text-gray-600">
          <div className="container mx-auto flex justify-between items-center">
            <div>University Applied Investments Class | Portfolio Tracker</div>
            <div>
              {!isAdminPage ? (
                <Link to="/admin/login" className="text-primary-600 hover:text-primary-800">
                  Admin Access
                </Link>
              ) : (
                <Link to="/" className="text-primary-600 hover:text-primary-800">
                  Return to Dashboard
                </Link>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
