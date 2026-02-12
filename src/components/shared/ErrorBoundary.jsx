import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: 'var(--status-error)',
              letterSpacing: '2px',
            }}
          >
            SYSTEM MALFUNCTION
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--hud-white-dim)',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '8px 24px',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--arc-blue)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--arc-blue)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Reboot Systems
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
