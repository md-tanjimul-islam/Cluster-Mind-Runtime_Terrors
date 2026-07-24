import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Network, HelpCircle, Plus, Play } from 'lucide-react';

export function Hero() {
  const { nodes, setActiveModal, setDemoStep } = useCluster();

  return (
    <section className="hero" aria-label="Dashboard header">
      <div>
        <p className="eyebrow">AI Cluster Operations Center</p>
        <h1>Welcome back, Runtime Terrors.</h1>
        <p className="hero-sub">
          ClusterMind is watching <strong>{nodes.length} nodes</strong> and preventing failures before they become downtime.
        </p>
      </div>

      <div className="hero-actions">
        <button className="btn btn-secondary" onClick={() => setActiveModal('topology')}>
          <Network />
          Cluster Topology
        </button>

        <button className="btn btn-secondary" onClick={() => setActiveModal('explain')}>
          <HelpCircle />
          How prediction works
        </button>

        <button className="btn btn-secondary" onClick={() => setActiveModal('node')}>
          <Plus />
          Connect node
        </button>

        <button className="btn btn-primary" onClick={() => { setDemoStep(0); setActiveModal('demo'); }}>
          <span className="btn-pulse-dot" aria-hidden="true"></span>
          Run failure simulation
        </button>
      </div>
    </section>
  );
}
