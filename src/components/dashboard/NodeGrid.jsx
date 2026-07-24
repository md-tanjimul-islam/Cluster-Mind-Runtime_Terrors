import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Search, Plus } from 'lucide-react';

export function NodeGrid() {
  const {
    nodes,
    statusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    workloadJobs,
    selectedRiskNodeId, setSelectedRiskNodeId,
    setSelectedNodeId, setActiveModal
  } = useCluster();

  const riskColor = (risk) => risk >= 65 ? 'var(--red)' : risk >= 30 ? 'var(--amber)' : 'var(--green)';
  const barColor  = (val)  => val >= 80 ? 'var(--red)'  : val >= 65 ? 'var(--amber)' : 'var(--cyan)';

  const filteredNodes = nodes.filter(node => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !node.id.toLowerCase().includes(q) && !(node.type || '').toLowerCase().includes(q)) return false;
    if (statusFilter === 'all')  return true;
    if (statusFilter === 'real') return node.source === 'real';
    return node.status === statusFilter;
  });

  const inspectNode = (id, e) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setActiveModal('nodeDetails');
  };

  return (
    <article className="panel node-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Predict</p>
          <h2 className="panel-title">Node health grid</h2>
        </div>
        <div className="node-controls">
          <div className="node-search-wrap">
            <Search />
            <input
              className="node-search"
              placeholder="Search node ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search nodes"
            />
          </div>

          <div className="filter-pills" role="group" aria-label="Node status filters">
            {['all', 'healthy', 'watch', 'critical', 'real'].map(f => (
              <button
                key={f}
                className={`pill ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button className="add-node-btn" onClick={() => setActiveModal('node')} aria-label="Connect a new node">
            <Plus />
            Connect node
          </button>
        </div>
      </div>

      <div className="node-grid" aria-live="polite">
        {filteredNodes.length === 0 ? (
          <div className="nodes-empty">No nodes match your filter criteria.</div>
        ) : (
          filteredNodes.map(node => {
            const sc = riskColor(node.risk);
            const isGpu = node.gpu || (node.type || '').toLowerCase().match(/gpu|rtx|gtx/);
            const isSelected = node.id === selectedRiskNodeId;
            const assignedJobs = workloadJobs.filter(j => j.node === node.id);
            const conn = node.source === 'real' ? (node.connection || (node.lastSeen ? 'offline' : 'waiting')) : 'online';
            const srcClass = conn === 'online' ? 'src-online' : conn === 'offline' ? 'src-offline' : 'src-waiting';

            return (
              <article
                key={node.id}
                className={`node-card ${node.risk >= 65 ? 'risk-critical' : ''} ${isSelected ? 'selected-risk-card' : ''} ${node.source ? 'has-src' : ''}`}
                onClick={() => setSelectedRiskNodeId(node.id)}
                style={{ '--sc': sc }}
              >
                <div className="node-top">
                  <div className="node-ident">
                    <span className="node-dot"></span>
                    <div>
                      <strong>{node.id}</strong>
                      <small>{node.type || ''}</small>
                    </div>
                  </div>
                  <div className="node-risk">
                    {node.risk}<span>%</span>
                  </div>
                </div>

                <div className="node-bars">
                  <div className="bar-item">
                    <div className="bar-head">CPU<b>{node.cpu}%</b></div>
                    <div className="mini-bar"><div className="mini-fill" style={{ width: `${node.cpu}%`, '--bc': barColor(node.cpu) }}></div></div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-head">{isGpu ? 'GPU' : 'RAM'}<b>{isGpu ? `${node.gpu || 0}%` : `${node.ram}%`}</b></div>
                    <div className="mini-bar"><div className="mini-fill" style={{ width: `${isGpu ? (node.gpu || 0) : node.ram}%`, '--bc': barColor(isGpu ? (node.gpu || 0) : node.ram) }}></div></div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-head">TEMP<b>{node.temp}°</b></div>
                    <div className="mini-bar"><div className="mini-fill" style={{ width: `${node.temp}%`, '--bc': barColor(node.temp) }}></div></div>
                  </div>
                </div>

                {assignedJobs.length > 0 && (
                  <div className="node-jobs-pills">
                    {assignedJobs.map(j => (
                      <span
                        key={j.id}
                        className={`node-job-badge ${j.status === 'Migrating' ? 'migrating' : ''}`}
                        title={j.name}
                      >
                        {j.id}
                      </span>
                    ))}
                  </div>
                )}

                <div className="node-foot">
                  <span>{node.jobs} active job{node.jobs === 1 ? '' : 's'}</span>
                  <button className="node-details-btn" onClick={(e) => inspectNode(node.id, e)}>
                    View details
                  </button>
                </div>

                {node.source && (
                  <span className={`src-pill ${srcClass}`}><i></i>{conn}</span>
                )}
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}
