import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Network, Server } from 'lucide-react';

export function TopologyModal() {
  const { activeModal, setActiveModal } = useCluster();

  if (activeModal !== 'topology') return null;

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-lg modal-topology-lg modal-nextgen" onClick={e => e.stopPropagation()}>
        <div className="modal-glowing-border" aria-hidden="true"></div>
        <button className="modal-close" onClick={() => setActiveModal('none')} aria-label="Close modal">×</button>

        <header className="modal-head modal-head-nextgen">
          <div className="modal-head-badge">
            <span className="live-dot" aria-hidden="true"></span>
            <span>CLUSTER INTERCONNECT ARCHITECTURE</span>
          </div>

          <div className="modal-head-main">
            <div className="modal-head-icon-lg" aria-hidden="true">
              <Network />
            </div>
            <div>
              <span className="eyebrow-tech">WORKLOAD MAPPING</span>
              <h2 className="modal-title-tech">Live Cluster Topology Map</h2>
              <p className="modal-head-sub">Real-time node status, interconnect links, and active migration channels.</p>
            </div>
          </div>
        </header>

        <div className="topo-diagram">
          <div className="topo-node topo-control">
            <span className="topo-chip">Controller</span>
            <strong>controller-01</strong>
            <small>Cluster Scheduler &amp; Risk Engine</small>
          </div>

          <div className="topo-lines-wrap" aria-hidden="true">
            <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="topo-svg">
              <line x1="200" y1="5" x2="60" y2="55" className="topo-line topo-active-line" />
              <line x1="200" y1="5" x2="200" y2="55" className="topo-line topo-warn-line" />
              <line x1="200" y1="5" x2="340" y2="55" className="topo-line topo-active-line" />
            </svg>
          </div>

          <div className="topo-workers">
            <div className="topo-node topo-worker healthy">
              <span className="topo-status" style={{ color: 'var(--green)' }}>🟢 Healthy</span>
              <strong>gpu-worker-01</strong>
              <span className="topo-job-tag">train-resnet-42</span>
              <small>VRAM 9.2 GB Free</small>
            </div>

            <div className="topo-node topo-worker critical">
              <span className="topo-status" style={{ color: 'var(--red)' }}>🔴 Anomaly (72%)</span>
              <strong>gpu-worker-02</strong>
              <span className="topo-job-tag warn">infer-llm-07</span>
              <small>Temp 81°C · Isolated</small>
            </div>

            <div className="topo-node topo-worker healthy">
              <span className="topo-status" style={{ color: 'var(--green)' }}>🟢 Healthy</span>
              <strong>gpu-worker-03</strong>
              <span className="topo-job-tag">batch-eval-09</span>
              <small>VRAM 5.4 GB Free</small>
            </div>
          </div>
        </div>

        <div className="topo-footer-note">
          <span className="topo-legend-item"><i className="dot-green"></i> Healthy Link</span>
          <span className="topo-legend-item"><i className="dot-red"></i> Isolated Node</span>
          <span className="topo-legend-item"><i className="dot-cyan"></i> Workload Migration Flow</span>
        </div>

        <footer className="modal-foot-nextgen">
          <div></div>
          <button className="btn btn-primary btn-nextgen-primary" onClick={() => setActiveModal('none')}>
            <span>Close Topology</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
