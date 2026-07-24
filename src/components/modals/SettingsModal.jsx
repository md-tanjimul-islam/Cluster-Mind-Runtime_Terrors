import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Settings, Sliders, Server, Shield, Bell, Palette, CheckCircle2, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export function SettingsModal() {
  const {
    activeModal, setActiveModal,
    theme, setTheme,
    sound, toggleSound,
    addToast
  } = useCluster();

  // Local settings state initialized from localStorage
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('clustermind-backend-url') || 'https://clustermind-backend-s51y.onrender.com');
  const [pollInterval, setPollInterval] = useState(() => localStorage.getItem('clustermind-poll-interval') || '2000');
  const [riskThreshold, setRiskThreshold] = useState(() => localStorage.getItem('clustermind-risk-threshold') || '65');
  const [autoHealMode, setAutoHealMode] = useState(() => localStorage.getItem('clustermind-autoheal-mode') || 'auto'); // 'auto' | 'manual'
  const [themePreset, setThemePreset] = useState(() => localStorage.getItem('clustermind-theme') || 'dark');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Esc key shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal === 'settings') {
        setActiveModal('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'settings') return null;

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const cleanBackend = backendUrl.trim().replace(/\/+$/, '');
    
    localStorage.setItem('clustermind-backend-url', cleanBackend);
    localStorage.setItem('clustermind-poll-interval', pollInterval);
    localStorage.setItem('clustermind-risk-threshold', riskThreshold);
    localStorage.setItem('clustermind-autoheal-mode', autoHealMode);
    localStorage.setItem('clustermind-theme', themePreset);

    setTheme(themePreset);
    setSavedSuccess(true);
    addToast('Settings Saved', 'ClusterMind configuration updated & applied', 'var(--cyan)');
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal('none');
      // Trigger a page reload if backend URL changed so context picks up new API target
      window.location.reload();
    }, 1000);
  };

  const handleResetDefaults = () => {
    setBackendUrl('https://clustermind-backend-s51y.onrender.com');
    setPollInterval('2000');
    setRiskThreshold('65');
    setAutoHealMode('auto');
    setThemePreset('dark');
    addToast('Defaults Restored', 'Configuration reset to nominal baseline', 'var(--amber)');
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section
        className="modal modal-wizard-v3"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '640px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <button className="modal-close" onClick={() => setActiveModal('none')} aria-label="Close settings (Esc)">×</button>

        <header className="wiz-header-v3" style={{ flexShrink: 0 }}>
          <div className="wiz-title-row">
            <div className="wiz-icon-avatar" style={{ background: 'color-mix(in srgb, var(--cyan) 16%, transparent)', border: '1px solid var(--cyan)' }}>
              <Settings style={{ width: '24px', height: '24px', color: 'var(--cyan)' }} />
            </div>
            <div className="wiz-title-text">
              <h2>ClusterMind Customization &amp; Stability Studio</h2>
              <p>Tailor real-time ingestion endpoints, IsolationForest sensitivity, &amp; visual theme</p>
            </div>
          </div>
        </header>

        <form className="wiz-form-v3" onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="wiz-body-v3" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
            {/* Section 1: Ingestion Network Server */}
            <div className="wiz-section-card">
              <div className="wiz-card-header">
                <div className="wiz-card-title">
                  <Server style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
                  <span>Ingestion Backend Server &amp; Polling Rate</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <span>FastAPI Backend Ingestion Endpoint URL</span>
                  <input
                    className="wiz-input font-mono"
                    value={backendUrl}
                    onChange={e => setBackendUrl(e.target.value)}
                    placeholder="https://clustermind-backend-s51y.onrender.com"
                    required
                  />
                </label>

                <div className="form-row-2">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Telemetry Heartbeat Refresh Rate</span>
                    <select
                      className="wiz-input font-mono"
                      value={pollInterval}
                      onChange={e => setPollInterval(e.target.value)}
                    >
                      <option value="1000">1.0 Seconds (Ultra-Fast Stream)</option>
                      <option value="2000">2.0 Seconds (Standard Balanced)</option>
                      <option value="4000">4.0 Seconds (Eco Bandwidth)</option>
                      <option value="8000">8.0 Seconds (Low Power)</option>
                    </select>
                  </label>

                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Auto-Healing Workload Mode</span>
                    <select
                      className="wiz-input"
                      value={autoHealMode}
                      onChange={e => setAutoHealMode(e.target.value)}
                    >
                      <option value="auto">Autonomous Auto-Heal (Instant)</option>
                      <option value="manual">Manual Operator Approval</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: AI Anomaly Sensitivity */}
            <div className="wiz-section-card">
              <div className="wiz-card-header">
                <div className="wiz-card-title">
                  <Shield style={{ width: '16px', height: '16px', color: 'var(--amber)' }} />
                  <span>IsolationForest Anomaly Sensitivity</span>
                </div>
                <span className="wiz-step-pill">{riskThreshold}% THRESHOLD</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Strict (50% Anomaly Trigger)</span>
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>Selected: {riskThreshold}% Risk Index</span>
                  <span>Conservative (85% Anomaly Trigger)</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="85"
                  step="5"
                  value={riskThreshold}
                  onChange={e => setRiskThreshold(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--cyan)', cursor: 'pointer' }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  When IsolationForest multi-vector kernel anomaly score crosses {riskThreshold}%, ClusterMind initiates predictive workload migration.
                </p>
              </div>
            </div>

            {/* Section 3: Visual Theme & Preferences */}
            <div className="wiz-section-card">
              <div className="wiz-card-header">
                <div className="wiz-card-title">
                  <Palette style={{ width: '16px', height: '16px', color: 'var(--violet)' }} />
                  <span>Visual Theme &amp; Alert Preferences</span>
                </div>
              </div>

              <div className="form-row-2">
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <span>Interface Theme Preset</span>
                  <select
                    className="wiz-input"
                    value={themePreset}
                    onChange={e => setThemePreset(e.target.value)}
                  >
                    <option value="dark">Dark Cyberpunk (Default)</option>
                    <option value="light">High Contrast Light</option>
                  </select>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {sound ? <Volume2 style={{ color: 'var(--cyan)' }} /> : <VolumeX style={{ color: 'var(--text-muted)' }} />}
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', color: '#fff' }}>Audio Feedback</span>
                      <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chimes on risk spikes</small>
                    </div>
                  </div>
                  <button type="button" className={`pill ${sound ? 'active' : ''}`} onClick={toggleSound}>
                    {sound ? 'Enabled' : 'Muted'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="wiz-footer" style={{ flexShrink: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={handleResetDefaults}>
              <RotateCcw style={{ width: '14px', height: '14px' }} />
              <span>Reset Defaults</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal('none')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: savedSuccess ? 'var(--green)' : 'var(--cyan)' }}>
                {savedSuccess ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Sliders style={{ width: '16px', height: '16px' }} />}
                <span>{savedSuccess ? 'Saved & Reloading...' : 'Save Settings'}</span>
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
