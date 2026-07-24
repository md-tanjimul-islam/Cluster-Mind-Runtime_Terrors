import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { ShieldCheck, ArrowRightLeft, AlertTriangle } from 'lucide-react';

export function ActivityLog() {
  const { activity, addToast } = useCluster();

  const exportReport = () => {
    addToast('Report Exported', 'Cluster protection summary saved to downloads', 'var(--cyan)');
  };

  const getIcon = (type) => {
    if (type === 'shield') return <ShieldCheck style={{ color: 'var(--green)' }} />;
    if (type === 'move')   return <ArrowRightLeft style={{ color: 'var(--cyan)' }} />;
    return <AlertTriangle style={{ color: 'var(--amber)' }} />;
  };

  return (
    <article className="panel activity-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Audit Trail</p>
          <h2 className="panel-title">Recent activity</h2>
        </div>
        <button className="btn-ghost" onClick={exportReport}>Export report</button>
      </div>

      <div className="act-list" aria-label="Activity log">
        {activity.map((act, index) => (
          <div key={index} className="act-row">
            <div className="act-icon">
              {getIcon(act.type)}
            </div>
            <div>
              <div className="act-title">{act.title}</div>
              <div className="act-detail">{act.detail}</div>
            </div>
            <div className="act-time">{act.time}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
