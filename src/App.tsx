import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import CreateLabel from './pages/CreateLabel';
import PrintQueue from './pages/PrintQueue';
import RecipientManagement from './pages/RecipientManagement';
import ProductManagement from './pages/ProductManagement';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-label" element={<CreateLabel />} />
            <Route path="/print-queue" element={<PrintQueue />} />
            <Route path="/recipients" element={<RecipientManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/labels" element={<PrintQueue />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
