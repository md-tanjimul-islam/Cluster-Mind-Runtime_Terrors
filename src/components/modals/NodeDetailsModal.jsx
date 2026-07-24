import React, { useState } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Server, Copy, Check, ShieldAlert } from 'lucide-react';

export function NodeDetailsModal() {
  const { activeModal, setActiveModal, nodes, selectedNodeId, workloadJobs, deleteNode, addToast } = useCluster();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'nodeDetails') return null;

  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const statusLabel = { critical:'Critical risk', watch:'Under watch', pending:'Awaiting telemetry', healthy:'Healthy' }[node.status] || 'Healthy';
  const statusColor = { critical:'var(--red)', watch:'var(--amber)', pending:'var(--violet)', healthy:'var(--green)' }[node.status] || 'var(--green)';

  const assignedJobs = workloadJobs.filter(j => j.node === node.id);
  const source = node.source || 'built-in';

  const token = '[HMAC_TOKEN_SECRET]';
  const endpoint = `http://127.0.0.1:8080/api/ingest`;
  const telemetryCmd = `curl -X POST "${endpoint}" -H "Content-Type: application/json" -d "{\\"token\\":\\"${token}\\",\\"id\\":\\"${node.id}\\",\\"cpu\\":42,\\"gpu\\":78,\\"ram\\":61,\\"temp\\":67}"`;

  const copyTelemetryCmd = () => {
    navigator.clipboard.writeText(telemetryCmd);
    setCopied(true);
    addToast('Command Copied', 'Telemetry test curl command copied to clipboard', 'var(--cyan)');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (deleteConfirmation.trim() !== node.id) {
      setDeleteError('The confirmation name does not match.');
      return;
    }
    deleteNode(node.id);
    setActiveModal('none');
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-lg modal-nextgen" onClick={e => e.stopPropagation()}>
        <div className="modal-glowing-border" aria-hidden="true"></div>
        <button className="modal-close" onClick={() => setActiveModal('none')} aria-label="Close modal">×</button>

        <header className="modal-head modal-head-nextgen">
          <div className="modal-head-badge">
            <span className="live-dot" aria-hidden="true"></span>
            <span>HARDWARE INSPECTOR</span>
          </div>

          <div className="modal-head-main">
            <div className="modal-head-icon-lg" aria-hidden="true">
              <Server />
            </div>
            <div>
              <span className="eyebrow-tech">{node.type || 'WORKER NODE'}</span>
              <h2 className="modal-title-tech">{node.id}</h2>
              <p className="modal-head-sub">Detailed hardware metrics, active workload placement, and token management.</p>
            </div>

            <span
              className="details-health-tag"
              style={{
                marginLeft: 'auto',
                color: statusColor,
                background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`
              }}
            >
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Metrics Row */}
        <div className="metrics-row">
          <div className="metric-mini"><span>CPU</span><strong>{node.cpu}%</strong></div>
          <div className="metric-mini"><span>GPU</span><strong>{node.gpu ? `${node.gpu}%` : 'N/A'}</strong></div>
          <div className="metric-mini"><span>RAM</span><strong>{node.ram}%</strong></div>
          <div className="metric-mini"><span>Temp</span><strong>{node.temp}°C</strong></div>
          <div className="metric-mini"><span>AI risk</span><strong>{node.risk}%</strong></div>
        </div>

        {/* Assigned Jobs Box */}
        <div className="info-box node-jobs-box">
          <h3>Assigned Workload Jobs</h3>
          <div className="node-jobs-list">
            {assignedJobs.length > 0 ? (
              assignedJobs.map(j => (
                <div key={j.id} className="node-job-row">
                  <div className="nj-info">
                    <strong className="nj-id">{j.id}</strong>
                    <span className="nj-name">{j.name}</span>
                  </div>
                  <span className="nj-badge">{j.category}</span>
                  <span className="nj-prog">{j.progress}</span>
                  <span className={`nj-status ${j.status === 'Migrating' ? 'warn' : ''}`}>
                    {j.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="nj-empty">No active workloads currently assigned to this node.</p>
            )}
          </div>
        </div>

        {/* Connection Box */}
        <div className="info-box">
          <h3>Connection Information</h3>
          <div className="kv-grid">
            <div className="kv-pair"><span>Hardware Specs</span><b>{node.type || 'Standard Hardware'}</b></div>
            <div className="kv-pair"><span>Source</span><b>{source}</b></div>
            <div className="kv-pair"><span>Connection</span><b>{source === 'real' ? (node.connection || 'waiting') : 'online'}</b></div>
            <div className="kv-pair"><span>Active jobs</span><b>{node.jobs}</b></div>
            <div className="kv-pair"><span>Last seen</span><b>{source === 'real' ? 'Waiting for first packet' : 'Live now'}</b></div>
            <div className="kv-pair"><span>Interval</span><b>5 seconds</b></div>
          </div>

          <code className="code-block" style={{ marginTop: '10px' }}>{telemetryCmd}</code>
          <button className="copy-link" type="button" onClick={copyTelemetryCmd} style={{ marginTop: '8px' }}>
            {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
            <span>Copy telemetry test command</span>
          </button>
        </div>

        {/* Danger Zone / Deletion */}
        {node.source ? (
          <div className="danger-box">
            <h3>Remove this node</h3>
            <p>Deleting a real node revokes its registration and agent token immediately.</p>
            <label className="form-label" style={{ marginTop: '12px' }}>
              <span>Type <strong style={{ color: 'var(--red)' }}>{node.id}</strong> to confirm</span>
              <input
                className="form-input"
                style={{ marginTop: '6px' }}
                value={deleteConfirmation}
                onChange={e => {
                  setDeleteConfirmation(e.target.value);
                  setDeleteError('');
                }}
                placeholder={node.id}
              />
            </label>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <button
              type="button"
              className="btn btn-danger"
              disabled={deleteConfirmation.trim() !== node.id}
              onClick={handleDelete}
              style={{ marginTop: '10px' }}
            >
              Delete node permanently
            </button>
          </div>
        ) : (
          <div className="protected-note">
            <strong>Protected Cluster Node</strong>
            <p>Built-in nodes cannot be deleted from the dashboard to protect demo stability.</p>
          </div>
        )}

        <footer className="modal-foot-nextgen">
          <div></div>
          <button className="btn btn-primary btn-nextgen-primary" onClick={() => setActiveModal('none')}>
            <span>Close Inspector</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
