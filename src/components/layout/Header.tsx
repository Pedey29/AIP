import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

const Header: React.FC = () => {
  const { totalValue, isAdmin, setIsAdmin } = usePortfolio();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    setIsAdmin(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-primary-700">
            Investment Portfolio Tracker
          </Link>
          <span className="ml-4 text-gray-500">|</span>
          <h1 className="ml-4 text-lg font-medium">
            {isAdminPage ? 'Admin Panel' : 'Portfolio Dashboard'}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {!isAdminPage && (
            <div className="text-lg font-semibold">
              Total Value: <span className="text-primary-700">${totalValue.toLocaleString()}</span>
            </div>
          )}
          {isAdmin && (
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
