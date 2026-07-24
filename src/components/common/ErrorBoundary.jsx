import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ClusterMind UI Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '20px',
          background: 'var(--surface, #1e293b)',
          border: '1px solid var(--red, #ef4444)',
          borderRadius: '12px',
          color: '#fff',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--red, #ef4444)', marginBottom: '8px' }}>Component Render Recovered</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
            An unexpected state variation occurred. The cluster monitoring engine automatically recovered.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ padding: '6px 16px', fontSize: '0.8125rem' }}
          >
            Refresh Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
