import React, { useState } from 'react';
import { useLLMKeyStore } from '@/store/llmKeyStore';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const { anthropicKey, openaiKey, googleKey, groqKey, ollamaUrl, setKey, clearAllKeys, hasAnyKey } = useLLMKeyStore();
  
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
          <h2>LLM API Keys</h2>
          <p className="section-description">
            Configure API keys for LLM-powered threat analysis. Keys are stored in memory only and cleared when you close the browser.
          </p>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Anthropic</h3>
              <p>Claude models for Tier 2 analysis</p>
            </div>
            <div className="setting-control">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setKey('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="key-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>OpenAI</h3>
              <p>GPT-4o for Tier 2 analysis</p>
            </div>
            <div className="setting-control">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setKey('openai', e.target.value)}
                placeholder="sk-..."
                className="key-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Google</h3>
              <p>Gemini models for Tier 1/2 analysis</p>
            </div>
            <div className="setting-control">
              <input
                type="password"
                value={googleKey}
                onChange={(e) => setKey('google', e.target.value)}
                placeholder="AIza..."
                className="key-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Groq</h3>
              <p>Fast Llama models for Tier 1 analysis</p>
            </div>
            <div className="setting-control">
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setKey('groq', e.target.value)}
                placeholder="gsk_..."
                className="key-input"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h3>Ollama (Local)</h3>
              <p>Local LLM server URL</p>
            </div>
            <div className="setting-control">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setKey('ollama', e.target.value)}
                placeholder="http://localhost:11434"
                className="key-input"
                autoComplete="off"
              />
            </div>
          </div>
          {hasAnyKey() && (
            <div className="setting-item">
              <div className="setting-info">
                <h3>Clear All Keys</h3>
                <p>Remove all API keys from memory</p>
              </div>
              <div className="setting-control">
                <button className="action-button delete-button" onClick={clearAllKeys}>
                  Clear All
                </button>
              </div>
            </div>
          )}
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
