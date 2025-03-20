import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';

// Pages
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Layout
import Layout from './components/layout/Layout';

const App: React.FC = () => {
  return (
    <PortfolioProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </PortfolioProvider>
  );
};

export default App;
