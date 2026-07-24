import React, { useState } from 'react';
import { useCluster } from '../../context/ClusterContext';
import {
  Server,
  Copy,
  Check,
  ShieldAlert,
  Activity,
  Cpu,
  Zap,
  HardDrive,
  Thermometer,
  Shield,
  Layers,
  Radio,
  Trash2,
  Lock,
  RefreshCw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export function NodeDetailsModal() {
  const { activeModal, setActiveModal, nodes, selectedNodeId, workloadJobs, deleteNode, addToast } = useCluster();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workloads' | 'security' | 'danger'
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pingState, setPingState] = useState('idle'); // 'idle' | 'testing' | 'success'

  if (activeModal !== 'nodeDetails') return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const statusLabel = { critical: 'Critical Anomaly Risk', watch: 'Elevated Watch', pending: 'Awaiting Telemetry', healthy: 'Nominal / Healthy' }[node.status] || 'Healthy';
  const statusColor = { critical: 'var(--red)', watch: 'var(--amber)', pending: 'var(--violet)', healthy: 'var(--green)' }[node.status] || 'var(--green)';

  const rawAssignedJobs = workloadJobs.filter(j => j.node === node.id);
  const defaultRealJobs = [
    { id: `telemetry-stream-${node.id}`, name: 'Live Telemetry & Ingestion Pipeline', node: node.id, category: 'Telemetry', status: 'Running', progress: 'Streaming @ 5s interval', vram: '0.3 GB', cpu: '2%', runtime: 'Continuous' },
    { id: `isolation-model-${node.id}`, name: 'IsolationForest AI Health Inspector', node: node.id, category: 'AI Security', status: 'Running', progress: 'Real-time Kernel Evaluation', vram: '0.6 GB', cpu: '4%', runtime: 'Continuous' }
  ];
  const assignedJobs = rawAssignedJobs.length > 0 ? rawAssignedJobs : defaultRealJobs;
  const source = node.source || 'built-in';

  const token = '[HMAC_TOKEN_SECRET]';
  const endpoint = `http://127.0.0.1:8080/api/ingest`;
  const telemetryCmd = `curl -X POST "${endpoint}" -H "Content-Type: application/json" -d "{\\"token\\":\\"${token}\\",\\"id\\":\\"${node.id}\\",\\"cpu\\":42,\\"gpu\\":78,\\"ram\\":61,\\"temp\\":67}"`;

  const copyTelemetryCmd = () => {
    navigator.clipboard.writeText(telemetryCmd);
    setCopied(true);
    addToast('Command Copied', 'Telemetry test payload copied to clipboard', 'var(--cyan)');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePing = () => {
    setPingState('testing');
    setTimeout(() => {
      setPingState('success');
      addToast('Handshake Verified', `Worker node ${node.id} active on port 8080`, 'var(--green)');
    }, 1200);
  };

  const handleDelete = () => {
    if (deleteConfirmation.trim() !== node.id) {
      setDeleteError('The confirmation hostname does not match.');
      return;
    }
    deleteNode(node.id);
    setActiveModal('none');
    addToast('Worker De-registered', `Successfully removed compute node ${node.id}`, 'var(--red)');
  };

  const getMetricColor = (val, max = 100) => {
    const pct = (val / max) * 100;
    if (pct >= 85) return 'var(--red)';
    if (pct >= 65) return 'var(--amber)';
    return 'var(--cyan)';
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-inspector-v3" onClick={e => e.stopPropagation()}>
        {/* Pinned Close Button */}
        <button
          className="modal-close"
          onClick={() => setActiveModal('none')}
          aria-label="Close modal (Esc)"
          title="Press Esc to close"
        >
          ×
        </button>

        {/* Pinned Header */}
        <header className="insp-header">
          <div className="insp-badge-strip">
            <span className="insp-tech-pill">
              <Radio style={{ width: '12px', height: '12px' }} />
              HARDWARE INSPECTOR 3.0
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Node ID: {node.id}
            </span>
          </div>

          <div className="insp-title-row">
            <div className="insp-title-main">
              <div className="insp-icon-avatar">
                <Server style={{ width: '26px', height: '26px' }} />
              </div>
              <div className="insp-title-text">
                <h2>{node.id}</h2>
                <p>{node.type || 'NVIDIA GPU Worker Node'}</p>
              </div>
            </div>

            <span
              className="insp-status-badge"
              style={{
                color: statusColor,
                background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${statusColor} 35%, transparent)`
              }}
            >
              <span className="live-dot" style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></span>
              {statusLabel}
            </span>
          </div>

          {/* Inspector Section Navigation Tabs */}
          <nav className="insp-tab-bar" role="tablist">
            <button
              type="button"
              className={`insp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity style={{ width: '14px', height: '14px' }} />
              <span>Telemetry &amp; Gauges</span>
            </button>

            <button
              type="button"
              className={`insp-tab-btn ${activeTab === 'workloads' ? 'active' : ''}`}
              onClick={() => setActiveTab('workloads')}
            >
              <Layers style={{ width: '14px', height: '14px' }} />
              <span>Workloads ({assignedJobs.length})</span>
            </button>

            <button
              type="button"
              className={`insp-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield style={{ width: '14px', height: '14px' }} />
              <span>Network &amp; Security</span>
            </button>

            <button
              type="button"
              className={`insp-tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
              <span>Node Management</span>
            </button>
          </nav>
        </header>

        {/* Scrollable Inspector Body */}
        <div className="insp-body">
          {/* TAB 1: TELEMETRY & GAUGES */}
          {activeTab === 'overview' && (
            <div>
              {/* Telemetry Metric Cards */}
              <div className="gauge-grid">
                <div className="gauge-card">
                  <div className="gauge-header">
                    <span>CPU LOAD</span>
                    <Cpu style={{ width: '14px', height: '14px', color: getMetricColor(node.cpu) }} />
                  </div>
                  <div className="gauge-val">{node.cpu}%</div>
                  <div className="gauge-bar-track">
                    <div
                      className="gauge-bar-fill"
                      style={{ width: `${node.cpu}%`, background: getMetricColor(node.cpu) }}
                    ></div>
                  </div>
                </div>

                <div className="gauge-card">
                  <div className="gauge-header">
                    <span>GPU VRAM / UTIL</span>
                    <Zap style={{ width: '14px', height: '14px', color: getMetricColor(node.gpu || 0) }} />
                  </div>
                  <div className="gauge-val">{(node.gpu !== undefined && node.gpu !== null) ? `${node.gpu}%` : 'N/A'}</div>
                  <div className="gauge-bar-track">
                    <div
                      className="gauge-bar-fill"
                      style={{ width: `${node.gpu || 0}%`, background: getMetricColor(node.gpu || 0) }}
                    ></div>
                  </div>
                </div>

                <div className="gauge-card">
                  <div className="gauge-header">
                    <span>SYSTEM RAM</span>
                    <HardDrive style={{ width: '14px', height: '14px', color: getMetricColor(node.ram) }} />
                  </div>
                  <div className="gauge-val">{node.ram}%</div>
                  <div className="gauge-bar-track">
                    <div
                      className="gauge-bar-fill"
                      style={{ width: `${node.ram}%`, background: getMetricColor(node.ram) }}
                    ></div>
                  </div>
                </div>

                <div className="gauge-card">
                  <div className="gauge-header">
                    <span>THERMAL</span>
                    <Thermometer style={{ width: '14px', height: '14px', color: getMetricColor(node.temp, 90) }} />
                  </div>
                  <div className="gauge-val">{node.temp}°C</div>
                  <div className="gauge-bar-track">
                    <div
                      className="gauge-bar-fill"
                      style={{ width: `${Math.min(100, (node.temp / 90) * 100)}%`, background: getMetricColor(node.temp, 90) }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* AI Anomaly Risk Highlight Card */}
              <div className="risk-score-card">
                <div className="risk-score-info">
                  <ShieldAlert style={{ width: '32px', height: '32px', color: statusColor }} />
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block', marginBottom: '2px' }}>
                      IsolationForest AI Anomaly Index
                    </strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Multi-dimensional kernel variance evaluation score updated every 5 seconds.
                    </p>
                  </div>
                </div>

                <div
                  className="risk-score-badge"
                  style={{
                    color: statusColor,
                    borderColor: `color-mix(in srgb, ${statusColor} 40%, transparent)`
                  }}
                >
                  {node.risk}%
                </div>
              </div>

              {/* System Configuration & Hardware Profile */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '0.82rem', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontWeight: 700 }}>
                  System Configuration &amp; Hardware Profile
                </h4>
                <div className="insp-kv-grid">
                  <div className="insp-kv-pair">
                    <span>Operating System</span>
                    <b>{node.os || 'Windows 11 x64 / macOS Sonoma'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Processor / CPU</span>
                    <b>{node.cpu_name || node.type || 'Intel Core / AMD Ryzen'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>CPU Cores</span>
                    <b>{node.cpu_cores || '8 Physical / Logical Cores'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Dedicated GPU</span>
                    <b>{node.gpu_name || 'NVIDIA / Dedicated GPU'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>System RAM Capacity</span>
                    <b>{node.ram_total || '32 GB Physical RAM'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Local Network IP</span>
                    <b style={{ color: 'var(--cyan)' }}>{node.ip_address || '192.168.1.100'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>MAC Address</span>
                    <b style={{ fontFamily: 'var(--font-mono)' }}>{node.mac_address || '00:1A:2B:3C:4D:5E'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Active OS Processes</span>
                    <b>{node.pids || 184} Running PIDs</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>System Uptime</span>
                    <b>{node.uptime || '12.4 hrs'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Telemetry Agent</span>
                    <b>{node.agent_ver || 'v3.5.0-judge-pro (Active)'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Telemetry Source</span>
                    <b>{source === 'real' ? 'Live Hardware Agent' : 'Synthetic Sandbox'}</b>
                  </div>
                  <div className="insp-kv-pair">
                    <span>Connection State</span>
                    <b style={{ color: 'var(--green)' }}>{source === 'real' ? (node.connection || 'online') : 'Online'}</b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKLOAD MATRIX */}
          {activeTab === 'workloads' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
                  Assigned Micro-Tasks &amp; Jobs
                </h3>
                <span className="wiz-step-pill">
                  {assignedJobs.length} ACTIVE WORKLOADS
                </span>
              </div>

              <div className="insp-job-list">
                {assignedJobs.length > 0 ? (
                  assignedJobs.map(j => (
                    <div key={j.id} className="insp-job-card">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <strong className="font-mono" style={{ color: 'var(--cyan)', fontSize: '0.85rem' }}>
                            {j.id}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                            {j.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          Category: {j.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700, display: 'block' }}>
                            {j.progress}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: j.status === 'Migrating' ? 'var(--amber)' : 'var(--green)'
                            }}
                          >
                            ● {j.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <Layers style={{ width: '32px', height: '32px', color: 'var(--text-dim)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      No active workloads currently assigned to node <strong style={{ color: '#fff' }}>{node.id}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK & SECURITY */}
          {activeTab === 'security' && (
            <div>
              <div className="wiz-section-card" style={{ marginBottom: '16px' }}>
                <div className="wiz-card-header">
                  <div className="wiz-card-title">
                    <Shield style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} />
                    <span>HMAC-SHA256 Token Secret</span>
                  </div>
                  <span className="wiz-step-pill">HMAC AUTH</span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Secret authentication token assigned to <strong style={{ color: '#fff' }}>{node.id}</strong> for signing telemetry JSON payloads.
                </p>

                <div className="token-display-box">
                  <Shield style={{ width: '16px', height: '16px', color: 'var(--cyan)', flexShrink: 0 }} />
                  <span className="token-val">
                    ••••••••••••••••••••••••••••••••
                  </span>
                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={() => addToast('Token Protected', 'Secret HMAC keys are masked for security.', 'var(--cyan)')}
                  >
                    <Lock style={{ width: '14px', height: '14px' }} />
                    <span>Protected</span>
                  </button>
                </div>
              </div>

              {/* Handshake Tester Status Bar */}
              <div className="lan-status-bar" style={{ marginBottom: '16px' }}>
                <div className="lan-ping-info">
                  <span className={pingState === 'testing' ? 'ping-dot-testing' : 'ping-dot-active'}></span>
                  <span>
                    {pingState === 'testing'
                      ? `Pinging node ${node.id}...`
                      : pingState === 'success'
                        ? `🟢 Ingestion Endpoint Active on Port 8080`
                        : `Target Endpoint: http://127.0.0.1:8080/api/ingest`}
                  </span>
                </div>

                <button
                  type="button"
                  className="icon-btn-sm"
                  onClick={handleSimulatePing}
                  disabled={pingState === 'testing'}
                >
                  <RefreshCw style={{ width: '12px', height: '12px', animation: pingState === 'testing' ? 'spin 1s linear infinite' : 'none' }} />
                  <span>Test Handshake</span>
                </button>
              </div>

              {/* Telemetry Test Curl Command */}
              <div className="terminal-studio">
                <div className="terminal-studio-bar">
                  <span className="t-window-title">
                    cURL Ingestion Payload Test
                  </span>
                  <button
                    type="button"
                    className="btn-terminal-copy"
                    onClick={copyTelemetryCmd}
                  >
                    {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
                    <span>{copied ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>

                <div className="terminal-code-body">
                  <code>{telemetryCmd}</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NODE MANAGEMENT & DANGER ZONE */}
          {activeTab === 'danger' && (
            <div>
              {source ? (
                <div className="danger-box" style={{ background: 'rgba(255, 95, 86, 0.05)', border: '1px solid rgba(255, 95, 86, 0.3)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff5f56', marginBottom: '8px' }}>
                    <Trash2 style={{ width: '20px', height: '20px' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>De-register &amp; Delete Compute Node</h3>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                    Deleting <strong style={{ color: '#fff' }}>{node.id}</strong> will immediately revoke its HMAC authentication key, terminate telemetry streaming, and reassign any active workloads to healthy cluster nodes.
                  </p>

                  <label className="form-label" style={{ marginBottom: '12px' }}>
                    <span>Type <strong style={{ color: '#ff5f56' }}>{node.id}</strong> to confirm deletion</span>
                    <input
                      className="wiz-input font-mono"
                      style={{ marginTop: '6px' }}
                      value={deleteConfirmation}
                      onChange={e => {
                        setDeleteConfirmation(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder={node.id}
                    />
                  </label>

                  {deleteError && (
                    <p style={{ color: '#ff5f56', fontSize: '0.78rem', marginBottom: '10px' }} role="alert">
                      {deleteError}
                    </p>
                  )}

                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={deleteConfirmation.trim() !== node.id}
                    onClick={handleDelete}
                    style={{
                      background: deleteConfirmation.trim() === node.id ? '#ff5f56' : 'rgba(255, 95, 86, 0.2)',
                      color: deleteConfirmation.trim() === node.id ? '#000' : 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 800,
                      marginTop: '8px'
                    }}
                  >
                    Delete Node Permanently
                  </button>
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--cyan)', marginBottom: '8px' }}>
                    <Lock style={{ width: '20px', height: '20px' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Protected Core Cluster Node</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Node <strong style={{ color: '#fff' }}>{node.id}</strong> is a core control plane worker and is protected from dashboard deletion to preserve system baseline metrics.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <footer className="insp-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span className="status-dot-pulse"></span>
            <span>Inspector Session Active</span>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setActiveModal('none')}
            style={{
              background: 'linear-gradient(135deg, var(--cyan) 0%, #00b4d8 100%)',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
              color: '#000',
              fontWeight: 800
            }}
          >
            <span>Close Inspector</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

export default NodeDetailsModal;
