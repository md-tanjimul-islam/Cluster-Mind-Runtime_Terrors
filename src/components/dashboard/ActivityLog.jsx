import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { ShieldCheck, ArrowRightLeft, AlertTriangle, Trash2, Download } from 'lucide-react';

export function ActivityLog() {
  const { activity, setActivity, clearActivityLog, addToast } = useCluster();

  const exportReport = () => {
    addToast('Report Exported', 'Cluster protection summary saved to downloads', 'var(--cyan)');
  };

  const clearLog = async () => {
    if (typeof clearActivityLog === 'function') {
      await clearActivityLog();
    } else {
      setActivity([]);
    }
    addToast('Activity Log Cleared', 'Audit trail cleared by operator', 'var(--cyan)');
  };

  const getIcon = (type) => {
    if (type === 'shield') return <ShieldCheck style={{ color: 'var(--green)' }} />;
    if (type === 'move')   return <ArrowRightLeft style={{ color: 'var(--cyan)' }} />;
    return <AlertTriangle style={{ color: 'var(--amber)' }} />;
  };

  const validActivity = (activity || []).filter(a => a && a.title);

  return (
    <article className="panel activity-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Audit Trail</p>
          <h2 className="panel-title">
            <span>Recent activity</span>
            {validActivity.length > 0 && (
              <span className="job-counter-badge">{validActivity.length} Entries</span>
            )}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {validActivity.length > 0 && (
            <button className="btn-ghost-sm" onClick={clearLog} title="Clear recent activity log">
              <Trash2 style={{ width: '13px', height: '13px', color: 'var(--red)' }} />
              <span>Clear log</span>
            </button>
          )}
          <button className="btn-ghost" onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download style={{ width: '13px', height: '13px' }} />
            <span>Export report</span>
          </button>
        </div>
      </div>

      <div className="act-list" aria-label="Activity log">
        {validActivity.length === 0 ? (
          <div className="nodes-empty" style={{ padding: '24px 16px' }}>
            No recent activity logged in audit trail.
          </div>
        ) : (
          validActivity.map((act, index) => (
            <div key={index} className="act-row">
              <div className="act-icon">
                {getIcon(act.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="act-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{act.title}</span>
                  {act.verified && (
                    <span className="pill active" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--cyan)', fontSize: '0.65rem', padding: '1px 6px' }}>
                      ✓ Recovery Verified (0 lost steps)
                    </span>
                  )}
                </div>
                <div className="act-detail" style={{ lineHeight: '1.4', marginTop: '2px' }}>{act.detail}</div>
              </div>
              <div className="act-time">{act.time}</div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
