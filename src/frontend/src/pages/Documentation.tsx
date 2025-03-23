import React from 'react';
import './Documentation.css';

const Documentation: React.FC = () => {
  return (
    <div className="documentation-page">
      <h1>Threat Oracle Documentation</h1>
      
      <div className="doc-section">
        <h2>Introduction</h2>
        <p>
          Threat Oracle is a visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach. 
          It helps security professionals, developers, and architects identify potential security vulnerabilities and suggests mitigations.
        </p>
        <p>
          Traditional threat modeling requires significant expertise, is often manual, and lacks visual representation. 
          Threat Oracle aims to revolutionize this process by providing a visual-first, schema-backed, graph-based threat modeling tool 
          that makes security accessible to everyone.
        </p>
      </div>
      
      <div className="doc-section">
        <h2>Key Concepts</h2>
        
        <div className="concept-card">
          <h3>Technical Assets</h3>
          <p>
            Technical assets represent the components of your system such as servers, applications, databases, and more. 
            Each asset has properties like name, type, owner, and criticality.
          </p>
          <div className="concept-example">
            <strong>Examples:</strong> Web servers, application servers, databases, APIs, containers
          </div>
        </div>
        
        <div className="concept-card">
          <h3>Trust Boundaries</h3>
          <p>
            Trust boundaries define the security zones in your system, such as network segments, security zones, and organizational boundaries. 
            They help identify where data crosses between different security contexts.
          </p>
          <div className="concept-example">
            <strong>Examples:</strong> Network segments, security zones, organizational boundaries, physical boundaries
          </div>
        </div>
        
        <div className="concept-card">
          <h3>Data Flows</h3>
          <p>
            Data flows represent how information moves between technical assets in your system. 
            They include properties like protocol, encryption status, and authentication method.
          </p>
          <div className="concept-example">
            <strong>Examples:</strong> HTTP requests, database queries, API calls, file transfers
          </div>
        </div>
        
        <div className="concept-card">
          <h3>Data Assets</h3>
          <p>
            Data assets represent the information that flows through your system, such as personal data, financial records, and configuration data. 
            They help identify what needs to be protected.
          </p>
          <div className="concept-example">
            <strong>Examples:</strong> Personal identifiable information (PII), financial data, health records, credentials
          </div>
        </div>
        
        <div className="concept-card">
          <h3>Threat Models</h3>
          <p>
            A threat model is a collection of technical assets, trust boundaries, data flows, and data assets that represent a system. 
            It can be analyzed to identify potential security vulnerabilities.
          </p>
          <div className="concept-example">
            <strong>Examples:</strong> Web application model, microservices architecture model, IoT system model
          </div>
        </div>
      </div>
      
      <div className="doc-section">
        <h2>Getting Started</h2>
        
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create or Import a Model</h3>
              <p>
                Start by creating a new threat model or importing an existing one. 
                Go to the Models page to create, import, or manage your threat models.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Define Technical Assets</h3>
              <p>
                Add technical assets to your model to represent the components of your system. 
                Specify their properties such as name, type, owner, and criticality.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Define Trust Boundaries</h3>
              <p>
                Add trust boundaries to your model to represent the security zones in your system. 
                Specify their properties such as name, type, and security level.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Map Data Flows</h3>
              <p>
                Add data flows to your model to represent how information moves between technical assets. 
                Specify their properties such as protocol, encryption status, and authentication method.
              </p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>Visualize and Analyze</h3>
              <p>
                Use the Visualization page to see your threat model as an interactive graph. 
                Analyze the model to identify potential security vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="doc-section">
        <h2>Features</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Visual Modeling</h3>
            <p>Create visual representations of your systems using a graph-based approach.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Import/Export</h3>
            <p>Import and export threat models in JSON format for sharing and collaboration.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Interactive Visualization</h3>
            <p>Explore your threat model with an interactive graph visualization.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>Access Threat Oracle from any device with a responsive web interface.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Security Analysis</h3>
            <p>Identify potential security vulnerabilities in your system (coming soon).</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Reporting</h3>
            <p>Generate reports of your threat model and findings (coming soon).</p>
          </div>
        </div>
      </div>
      
      <div className="doc-section">
        <h2>Additional Resources</h2>
        
        <ul className="resources-list">
          <li>
            <a href="https://github.com/microbrewerGM/Threat-Oracle" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </li>
          <li>
            <a href="https://owasp.org/www-community/Threat_Modeling" target="_blank" rel="noopener noreferrer">
              OWASP Threat Modeling
            </a>
          </li>
          <li>
            <a href="https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling" target="_blank" rel="noopener noreferrer">
              Microsoft Threat Modeling
            </a>
          </li>
          <li>
            <a href="https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html" target="_blank" rel="noopener noreferrer">
              OWASP Threat Modeling Cheat Sheet
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Documentation;
