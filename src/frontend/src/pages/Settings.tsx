import React, { useState } from 'react';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  // These functions would actually update settings in a real implementation
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleAutoSave = () => setAutoSave(!autoSave);
  const toggleNotifications = () => setNotifications(!notifications);
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p className="description">
        Configure your Threat Oracle experience with these settings.
      </p>
      
      <div className="settings-container">
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Dark Mode</h3>
              <p>Switch between light and dark color themes</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={toggleDarkMode}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Editor</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Auto Save</h3>
              <p>Automatically save changes to your threat model</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoSave} 
                  onChange={toggleAutoSave}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Notifications</h2>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Enable Notifications</h3>
              <p>Receive notifications about threats and updates</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications} 
                  onChange={toggleNotifications}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>About</h2>
          <div className="about-info">
            <p><strong>Threat Oracle</strong></p>
            <p>Version: 0.1.0</p>
            <p>A visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach.</p>
            <p className="disclaimer">This is a prototype version for demonstration purposes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
