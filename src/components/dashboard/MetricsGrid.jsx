import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Activity, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export function MetricsGrid() {
  const { nodes, impact } = useCluster();

  const avgLoad = nodes.length ? Math.round(nodes.reduce((acc, n) => acc + n.cpu, 0) / nodes.length) : 0;

  return (
    <section className="metrics-grid" aria-label="Cluster summary">
      <article className="metric-card accent-cyan">
        <div className="metric-icon">
          <Activity />
        </div>
        <div>
          <span className="metric-label">Cluster load</span>
          <strong className="metric-val">{avgLoad}%</strong>
          <small className="metric-note">Balanced across {nodes.length} nodes</small>
        </div>
        <div className="sparklet" aria-hidden="true"></div>
      </article>

      <article className="metric-card accent-green">
        <div className="metric-icon">
          <ShieldCheck />
        </div>
        <div>
          <span className="metric-label">Failures prevented</span>
          <strong className="metric-val">{impact.prevented.toLocaleString()}</strong>
          <small className="metric-note">+3 this week</small>
        </div>
        <div className="metric-tag">↑ 18%</div>
      </article>

      <article className="metric-card accent-violet">
        <div className="metric-icon">
          <DollarSign />
        </div>
        <div>
          <span className="metric-label">Estimated savings</span>
          <strong className="metric-val">${impact.savings.toLocaleString()}</strong>
          <small className="metric-note">Since monitoring began</small>
        </div>
        <div className="metric-tag">+$1.8K</div>
      </article>

      <article className="metric-card accent-amber">
        <div className="metric-icon">
          <Clock />
        </div>
        <div>
          <span className="metric-label">Mean recovery</span>
          <strong className="metric-val">{impact.recovery} sec</strong>
          <small className="metric-note">Industry baseline: 45 min</small>
        </div>
        <div className="metric-tag">99% faster</div>
      </article>
    </section>
  );
}
