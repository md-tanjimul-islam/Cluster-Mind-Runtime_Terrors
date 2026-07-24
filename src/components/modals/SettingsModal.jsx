import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Settings, Sliders, Server, Shield, Bell, Palette, CheckCircle2, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export function SettingsModal() {
  const {
    activeModal, setActiveModal,
    theme, setTheme,
    sound, toggleSound,
    riskThreshold: contextRiskThreshold,
    setRiskThreshold: setContextRiskThreshold,
    addToast,
    resetSystem,
    clearAllNodes
  } = useCluster();

  // Local settings state initialized from localStorage/context
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('clustermind-backend-url') || '');
  const [pollInterval, setPollInterval] = useState(() => localStorage.getItem('clustermind-poll-interval') || '2000');
  const [localRiskThreshold, setLocalRiskThreshold] = useState(() => contextRiskThreshold || parseInt(localStorage.getItem('clustermind-risk-threshold')) || 65);
  const [autoHealMode, setAutoHealMode] = useState(() => localStorage.getItem('clustermind-autoheal-mode') || 'auto'); // 'auto' | 'manual'
  const [themePreset, setThemePreset] = useState(() => localStorage.getItem('clustermind-theme') || 'dark');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep local threshold in sync with context when modal opens
  useEffect(() => {
    if (activeModal === 'settings') {
      setLocalRiskThreshold(contextRiskThreshold);
    }
  }, [activeModal, contextRiskThreshold]);

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
    const parsedThreshold = parseInt(localRiskThreshold, 10) || 65;
    
    if (cleanBackend) {
      localStorage.setItem('clustermind-backend-url', cleanBackend);
    } else {
      localStorage.removeItem('clustermind-backend-url');
    }

    localStorage.setItem('clustermind-poll-interval', pollInterval || '2000');
    localStorage.setItem('clustermind-risk-threshold', parsedThreshold.toString());
    localStorage.setItem('clustermind-autoheal-mode', autoHealMode);
    localStorage.setItem('clustermind-theme', themePreset);

    if (typeof setContextRiskThreshold === 'function') {
      setContextRiskThreshold(parsedThreshold);
    }
    if (typeof setTheme === 'function') {
      setTheme(themePreset);
    }

    setSavedSuccess(true);
    addToast('Settings Saved', `IsolationForest anomaly sensitivity set to ${parsedThreshold}% trigger threshold`, 'var(--cyan)');
    
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal('none');
      window.location.reload();
    }, 500);
  };

  const handleResetDefaults = () => {
    setBackendUrl('https://clustermind-backend-s51y.onrender.com');
    setPollInterval('2000');
    setLocalRiskThreshold(65);
    setContextRiskThreshold(65);
    setAutoHealMode('auto');
    setThemePreset('dark');
    addToast('Defaults Restored', 'IsolationForest sensitivity reset to 65% trigger baseline', 'var(--amber)');
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
                    placeholder="Auto (e.g. https://clustermind-backend-s51y.onrender.com)"
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
                <span className="wiz-step-pill">{localRiskThreshold}% THRESHOLD</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Strict (45% Anomaly Trigger)</span>
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>Selected: {localRiskThreshold}% Risk Index</span>
                  <span>Conservative (85% Anomaly Trigger)</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="85"
                  step="5"
                  value={localRiskThreshold}
                  onChange={e => setLocalRiskThreshold(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--cyan)', cursor: 'pointer' }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                  {localRiskThreshold <= 55 ? 'High Sensitivity (Strict): Triggers predictive workload migration at early telemetry drift.' : localRiskThreshold <= 70 ? 'Standard Sensitivity (Balanced): Nominal enterprise baseline (Default 65%).' : 'Low Sensitivity (Conservative): Triggers predictive workload migration only during severe spikes.'}
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

            {/* Pure Real-Device Mode Section */}
            <div className="wiz-section-card" style={{ borderColor: 'rgba(255, 171, 0, 0.3)', background: 'color-mix(in srgb, var(--amber) 5%, var(--surface))', marginBottom: '16px' }}>
              <div className="wiz-card-header">
                <div className="wiz-card-title">
                  <Server style={{ width: '16px', height: '16px', color: 'var(--amber)' }} />
                  <span>Pure Real-Device Mode (Clear Demo Nodes)</span>
                </div>
                <span className="wiz-step-pill" style={{ color: 'var(--amber)', borderColor: 'rgba(255, 171, 0, 0.4)' }}>REAL DEVICES ONLY</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                Remove all synthetic demo nodes from the cluster. Use this mode when testing exclusively with physical hardware running live terminal telemetry agents.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (typeof clearAllNodes === 'function') {
                    clearAllNodes();
                    setActiveModal('none');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: 'var(--amber)',
                  color: 'var(--amber)',
                  fontWeight: 700
                }}
              >
                <Server style={{ width: '14px', height: '14px' }} />
                <span>Clear All Nodes &amp; Activate Pure Real-Device Mode</span>
              </button>
            </div>

            {/* System Baseline Recovery Reset Section */}
            <div className="wiz-section-card" style={{ borderColor: 'rgba(0, 242, 254, 0.3)', background: 'color-mix(in srgb, var(--cyan) 5%, var(--surface))' }}>
              <div className="wiz-card-header">
                <div className="wiz-card-title">
                  <RotateCcw style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
                  <span>Restore Initial Cluster Baseline</span>
                </div>
                <span className="wiz-step-pill">SYSTEM RESET</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                If you have deleted any initial demo nodes or workloads, click below to restore all default cluster nodes, initial incidents, and baseline metrics.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (typeof resetSystem === 'function') {
                    resetSystem();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: 'var(--cyan)',
                  color: 'var(--cyan)',
                  fontWeight: 700
                }}
              >
                <RotateCcw style={{ width: '14px', height: '14px' }} />
                <span>Reset Full System to Initial Baseline</span>
              </button>
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
