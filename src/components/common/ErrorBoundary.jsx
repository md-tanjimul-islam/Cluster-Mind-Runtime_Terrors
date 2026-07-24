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
    console.warn('ClusterMind UI Render Error auto-recovered:', error, errorInfo);
    // Auto-recover after 1s
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
