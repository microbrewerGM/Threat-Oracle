import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';
import Dashboard from '@/pages/Dashboard';
import TechnicalAssets from '@/pages/TechnicalAssets';
import TrustBoundaries from '@/pages/TrustBoundaries';
import DataFlows from '@/pages/DataFlows';
import DataAssets from '@/pages/DataAssets';
import Visualization from '@/pages/Visualization';
import Settings from '@/pages/Settings';
import Models from '@/pages/Models';
import Documentation from '@/pages/Documentation';
import NotFound from '@/pages/NotFound';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/technical-assets" element={<TechnicalAssets />} />
            <Route path="/trust-boundaries" element={<TrustBoundaries />} />
            <Route path="/data-flows" element={<DataFlows />} />
            <Route path="/data-assets" element={<DataAssets />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/models" element={<Models />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
