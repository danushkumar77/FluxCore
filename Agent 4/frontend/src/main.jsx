import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          background: '#0A111C', 
          color: '#FF3B30', 
          height: '100vh', 
          fontFamily: 'monospace', 
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ color: '#FF3B30', fontSize: '20px', marginBottom: '20px', fontFamily: 'sans-serif' }}>
            ⚠️ Operations Center Initialization Error
          </h1>
          <p style={{ color: '#E2E8F0', marginBottom: '10px', fontFamily: 'sans-serif', fontSize: '14px' }}>
            The AI control console could not mount due to a runtime script exception in the browser:
          </p>
          <pre style={{ 
            background: '#111A2E', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #1E2E4A', 
            color: '#FF9500', 
            whiteSpace: 'pre-wrap',
            fontSize: '13px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ 
            color: '#64748B', 
            whiteSpace: 'pre-wrap', 
            marginTop: '15px',
            fontSize: '11px'
          }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
