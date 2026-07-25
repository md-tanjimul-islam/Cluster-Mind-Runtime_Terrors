import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Activity, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export function MetricsGrid() {
  const { nodes, impact, user } = useCluster();

  const isPureReal = localStorage.getItem('clustermind-pure-real-mode') === 'true' || user?.isPureReal;

  const avgLoad = nodes.length ? Math.round(nodes.reduce((acc, n) => acc + (n.cpu || 0), 0) / nodes.length) : 0;
  const preventedVal = impact?.prevented ?? (isPureReal ? 0 : 47);
  const savingsVal = impact?.savings ?? (isPureReal ? 0 : 38980);
  const recoveryVal = impact?.recovery ?? 24;

  return (
    <section className="metrics-grid" aria-label="Cluster summary">
      <article className="metric-card accent-cyan">
        <div className="metric-icon">
          <Activity />
        </div>
        <div>
          <span className="metric-label">Cluster load</span>
          <strong className="metric-val">{avgLoad}%</strong>
          <small className="metric-note">Balanced across {nodes.length} {isPureReal ? 'real' : ''} node{nodes.length === 1 ? '' : 's'}</small>
        </div>
        <div className="sparklet" aria-hidden="true"></div>
      </article>

      <article className="metric-card accent-green">
        <div className="metric-icon">
          <ShieldCheck />
        </div>
        <div>
          <span className="metric-label">Failures prevented</span>
          <strong className="metric-val">{preventedVal.toLocaleString()}</strong>
          <small className="metric-note">{isPureReal ? (preventedVal > 0 ? `+${preventedVal} real incidents healed` : 'Real hardware agent monitoring') : '+3 this week'}</small>
        </div>
        <div className="metric-tag">{isPureReal ? (preventedVal > 0 ? `+${preventedVal} real` : '0 real') : '↑ 18%'}</div>
      </article>

      <article className="metric-card accent-violet">
        <div className="metric-icon">
          <DollarSign />
        </div>
        <div>
          <span className="metric-label">Estimated savings</span>
          <strong className="metric-val">${savingsVal.toLocaleString()}</strong>
          <small className="metric-note">Since monitoring began</small>
        </div>
        <div className="metric-tag">{isPureReal ? (savingsVal > 0 ? `+$${(savingsVal / 1000).toFixed(1)}K` : '$0') : '+$1.8K'}</div>
      </article>

      <article className="metric-card accent-amber">
        <div className="metric-icon">
          <Clock />
        </div>
        <div>
          <span className="metric-label">Mean recovery</span>
          <strong className="metric-val">{recoveryVal} sec</strong>
          <small className="metric-note">Industry baseline: 45 min</small>
        </div>
        <div className="metric-tag">99% faster</div>
      </article>
    </section>
  );
}
