import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePortfolio } from '../../context/PortfolioContext';

// Icons (these would be imported from react-icons in a real project)
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center p-3 rounded-lg ${
        active
          ? 'bg-primary-100 text-primary-800'
          : 'text-gray-600 hover:bg-gray-100'
      } transition-colors`}
    >
      <span className="mr-3">{icon}</span>
      <span>{text}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = usePortfolio();
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-100"
        onClick={toggleSidebar}
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-white w-64 border-r border-gray-200 fixed md:static inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-10 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-700">Portfolio Tracker</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={<DashboardIcon />}
            text="Dashboard"
            to="/"
            active={currentPath === '/'}
          />
          <SidebarItem
            icon={<ChartIcon />}
            text="Performance"
            to="/"
            active={false}
          />
          <SidebarItem
            icon={<ReportIcon />}
            text="Reports"
            to="/"
            active={false}
          />
          {isAdmin && (
            <SidebarItem
              icon={<SettingsIcon />}
              text="Admin Panel"
              to="/admin"
              active={currentPath.startsWith('/admin')}
            />
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
              {isAdmin ? 'A' : 'S'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{isAdmin ? 'Admin User' : 'Student User'}</p>
              <p className="text-xs text-gray-500">Applied Investments</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
