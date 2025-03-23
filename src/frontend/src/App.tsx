import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Visualization from '@/pages/Visualization';
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
            <Route path="/visualization" element={<Visualization />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
