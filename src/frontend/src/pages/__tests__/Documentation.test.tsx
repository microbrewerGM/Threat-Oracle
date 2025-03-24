import React from 'react';
import { render, screen } from '@testing-library/react';
import Documentation from '../Documentation';

describe('Documentation Page', () => {
  it('renders the documentation page with all sections', () => {
    render(<Documentation />);
    
    // Check if the page title is rendered
    expect(screen.getByText('Threat Oracle Documentation')).toBeInTheDocument();
    
    // Check if all main sections are rendered
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Key Concepts')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Additional Resources')).toBeInTheDocument();
  });
  
  it('renders all key concept cards', () => {
    render(<Documentation />);
    
    // Check if all concept cards are rendered
    expect(screen.getByText('Technical Assets')).toBeInTheDocument();
    expect(screen.getByText('Trust Boundaries')).toBeInTheDocument();
    expect(screen.getByText('Data Flows')).toBeInTheDocument();
    expect(screen.getByText('Data Assets')).toBeInTheDocument();
    expect(screen.getByText('Threat Models')).toBeInTheDocument();
  });
  
  it('renders all getting started steps', () => {
    render(<Documentation />);
    
    // Check if all steps are rendered
    expect(screen.getByText('Create or Import a Model')).toBeInTheDocument();
    expect(screen.getByText('Define Technical Assets')).toBeInTheDocument();
    expect(screen.getByText('Define Trust Boundaries')).toBeInTheDocument();
    expect(screen.getByText('Map Data Flows')).toBeInTheDocument();
    expect(screen.getByText('Visualize and Analyze')).toBeInTheDocument();
  });
  
  it('renders all feature cards', () => {
    render(<Documentation />);
    
    // Check if all feature cards are rendered
    expect(screen.getByText('Visual Modeling')).toBeInTheDocument();
    expect(screen.getByText('Import/Export')).toBeInTheDocument();
    expect(screen.getByText('Interactive Visualization')).toBeInTheDocument();
    expect(screen.getByText('Responsive Design')).toBeInTheDocument();
    expect(screen.getByText('Security Analysis')).toBeInTheDocument();
    expect(screen.getByText('Reporting')).toBeInTheDocument();
  });
  
  it('renders external links in the resources section', () => {
    render(<Documentation />);
    
    // Check if all external links are rendered
    const links = screen.getAllByRole('link');
    
    // Check if there are at least 4 links (as specified in the component)
    expect(links.length).toBeGreaterThanOrEqual(4);
    
    // Check if the GitHub repository link is present
    const githubLink = links.find(link => link.textContent === 'GitHub Repository');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/microbrewerGM/Threat-Oracle');
    
    // Check if all links have target="_blank" and rel="noopener noreferrer" for security
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
