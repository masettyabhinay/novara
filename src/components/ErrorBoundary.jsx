import React from 'react';
import { Compass, RotateCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NOVARA ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-warm-cream, #FAF7F2)',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: 'var(--text-charcoal, #1C211F)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Logo Badge */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            backgroundColor: 'var(--accent-terracotta, #C85A32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: '16px',
            boxShadow: '0 6px 20px rgba(200, 90, 50, 0.25)'
          }}>
            <Compass size={30} strokeWidth={2.2} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-charcoal, #1C211F)',
              letterSpacing: '-0.02em'
            }}>
              NOVARA
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-terracotta, #C85A32)',
            marginTop: '8px',
            marginBottom: '4px'
          }}>
            <AlertTriangle size={18} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: 800,
              margin: 0
            }}>
              Something went wrong.
            </h2>
          </div>

          <p style={{
            fontSize: '13.5px',
            color: 'var(--text-secondary, #5C6460)',
            maxWidth: '380px',
            margin: '6px 0 20px 0',
            lineHeight: '1.5'
          }}>
            NOVARA couldn't load this screen. An unexpected error occurred.
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-terracotta, #C85A32)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(200, 90, 50, 0.25)',
              transition: 'all 150ms ease'
            }}
          >
            <RotateCw size={15} />
            <span>Try Again</span>
          </button>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div style={{
              marginTop: '28px',
              padding: '14px',
              backgroundColor: '#FFF1EE',
              border: '1px solid rgba(200, 90, 50, 0.2)',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              textAlign: 'left',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#9C3312',
              overflowX: 'auto',
              maxHeight: '180px'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                {this.state.error.toString()}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                {this.state.error.stack}
              </div>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
