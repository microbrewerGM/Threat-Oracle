import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        {collapsed ? '>' : '<'}
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/">
              <span className="icon">📊</span>
              <span className="text">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/technical-assets">
              <span className="icon">🖥️</span>
              <span className="text">Technical Assets</span>
            </Link>
          </li>
          <li>
            <Link to="/trust-boundaries">
              <span className="icon">🔒</span>
              <span className="text">Trust Boundaries</span>
            </Link>
          </li>
          <li>
            <Link to="/data-flows">
              <span className="icon">↔️</span>
              <span className="text">Data Flows</span>
            </Link>
          </li>
          <li>
            <Link to="/data-assets">
              <span className="icon">📁</span>
              <span className="text">Data Assets</span>
            </Link>
          </li>
          <li>
            <Link to="/visualization">
              <span className="icon">🔍</span>
              <span className="text">Visualization</span>
            </Link>
          </li>
          <li>
            <Link to="/knowledge-graph">
              <span className="icon">🧠</span>
              <span className="text">Knowledge Graph</span>
            </Link>
          </li>
          <li>
            <Link to="/settings">
              <span className="icon">⚙️</span>
              <span className="text">Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
