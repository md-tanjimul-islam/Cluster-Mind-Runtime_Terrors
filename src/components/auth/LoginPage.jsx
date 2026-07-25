import React, { useState } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Shield, Lock, Mail, Key, Eye, EyeOff, Cpu, Activity, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login } = useCluster();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(email, password, rememberMe);
      if (!res.ok) {
        setError(res.message);
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsSubmitting(true);
    setTimeout(() => {
      login(demoEmail, demoPass, rememberMe);
    }, 400);
  };

  return (
    <div className="login-gateway-container">
      <div className="login-backdrop-glow"></div>
      <div className="login-grid-pattern"></div>

      <div className="login-card-wrapper">
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-shield-badge">
            <Shield style={{ width: '28px', height: '28px', color: 'var(--cyan)' }} />
            <div className="shield-pulse-ring"></div>
          </div>

          <h1 className="login-title">
            Cluster<span style={{ color: 'var(--cyan)' }}>Mind</span> <span style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 500 }}>AI Gateway</span>
          </h1>

          <p className="login-subtitle">
            Autonomous Cluster Failure Prevention &amp; Real-Device Ingestion Security
          </p>

          <div className="login-security-tag">
            <span className="sec-dot"></span>
            <span>256-BIT HMAC AUTHENTICATION ENFORCED</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-field-group">
            <label className="login-label">
              <span>Security Access Identity / Email</span>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder="admin@clustermind.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="login-label">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>HMAC Secret Key / Password</span>
                <button
                  type="button"
                  className="login-toggle-pass"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="login-input-wrapper">
                <Key className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>
          </div>

          <div className="login-options-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Authorized Session</span>
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Strict TLS 1.3</span>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-sm"></div>
                <span>Verifying IsolationForest Credentials...</span>
              </>
            ) : (
              <>
                <Lock style={{ width: '16px', height: '16px' }} />
                <span>Authenticate &amp; Enter Dashboard</span>
                <ArrowRight style={{ width: '16px', height: '16px', marginLeft: 'auto' }} />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Fill Cards for Judges */}
        <div className="login-demo-section">
          <div className="demo-section-divider">
            <span>OR SELECT DEMO EVALUATOR ROLE FOR 1-CLICK ENTRY</span>
          </div>

          <div className="demo-roles-grid">
            {/* Role 0: Pure Real-Device Hardware Operator */}
            <button
              type="button"
              className="demo-role-card"
              onClick={() => handleQuickFill('real@clustermind.ai', 'RealHardware2026!')}
              style={{ borderColor: 'rgba(255, 171, 0, 0.4)', background: 'rgba(255, 171, 0, 0.05)' }}
            >
              <div className="role-icon-box real" style={{ background: 'rgba(255, 171, 0, 0.15)', color: 'var(--amber)' }}>
                <Cpu style={{ width: '18px', height: '18px' }} />
              </div>
              <div className="role-meta">
                <div className="role-header">
                  <strong className="role-name">Real Hardware Operator</strong>
                  <span className="role-pill real" style={{ background: 'rgba(255, 171, 0, 0.2)', color: 'var(--amber)' }}>0 DEMO DATA</span>
                </div>
                <span className="role-email" style={{ color: 'var(--amber)' }}>real@clustermind.ai</span>
                <small className="role-desc">Starts with 0 dummy nodes · Only real physical device hardware</small>
              </div>
            </button>

            {/* Role 1: Admin */}
            <button
              type="button"
              className="demo-role-card"
              onClick={() => handleQuickFill('admin@clustermind.ai', 'ClusterMind2026!')}
            >
              <div className="role-icon-box admin">
                <Shield style={{ width: '18px', height: '18px' }} />
              </div>
              <div className="role-meta">
                <div className="role-header">
                  <strong className="role-name">Cluster Admin</strong>
                  <span className="role-pill admin">FULL ACCESS</span>
                </div>
                <span className="role-email">admin@clustermind.ai</span>
                <small className="role-desc">Full telemetry, anomaly control &amp; node deletion</small>
              </div>
            </button>

            {/* Role 2: Security Auditor */}
            <button
              type="button"
              className="demo-role-card"
              onClick={() => handleQuickFill('auditor@clustermind.ai', 'AuditSecure2026!')}
            >
              <div className="role-icon-box auditor">
                <Activity style={{ width: '18px', height: '18px' }} />
              </div>
              <div className="role-meta">
                <div className="role-header">
                  <strong className="role-name">Security Auditor</strong>
                  <span className="role-pill auditor">AUDIT &amp; MODEL</span>
                </div>
                <span className="role-email">auditor@clustermind.ai</span>
                <small className="role-desc">IsolationForest model inspection &amp; audit trails</small>
              </div>
            </button>

            {/* Role 3: Guest Judge */}
            <button
              type="button"
              className="demo-role-card"
              onClick={() => handleQuickFill('demo@clustermind.ai', 'demo1234')}
            >
              <div className="role-icon-box judge">
                <Sparkles style={{ width: '18px', height: '18px' }} />
              </div>
              <div className="role-meta">
                <div className="role-header">
                  <strong className="role-name">Guest Judge / Evaluator</strong>
                  <span className="role-pill judge">1-CLICK TAP</span>
                </div>
                <span className="role-email">demo@clustermind.ai</span>
                <small className="role-desc">Instant 1-Tap hackathon demonstration credentials</small>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Security Badging */}
        <div className="login-footer-security">
          <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--green)' }} />
          <span>ClusterMind Secure Gateway v3.5.0 · Autonomous Self-Healing Microservice</span>
        </div>
      </div>
    </div>
  );
}
