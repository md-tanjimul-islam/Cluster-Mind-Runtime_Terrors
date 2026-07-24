import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { ShieldCheck, ShieldAlert, Cpu, ArrowRight, CheckCircle2, Play, Pause, Lock, Sliders, RefreshCw, Zap } from 'lucide-react';

const HEALING_STAGES = [
  { id: 1, title: 'Anomaly Detection', detail: 'IsolationForest ML kernel anomaly trigger' },
  { id: 2, title: 'Vector Inference', detail: '6D Telemetry risk score evaluation' },
  { id: 3, title: 'State Checkpoint', detail: 'Saving active process RAM & PID state' },
  { id: 4, title: 'Target Allocation', detail: 'Selected healthy destination node' },
  { id: 5, title: 'Live Migration', detail: 'Zero-downtime workload stream transfer' },
  { id: 6, title: 'Health Restored', detail: 'Cluster rebalance & audit log saved' }
];

export function HealingProcessPanel() {
  const { nodes, incident, completeHealing, addToast, injectScenario } = useCluster();
  
  // Read auto-heal mode setting from localStorage ('auto' | 'manual')
  const [autoHealMode, setAutoHealMode] = useState(() => localStorage.getItem('clustermind-autoheal-mode') || 'auto');
  const [activeStage, setActiveStage] = useState(1);
  const [stageProgress, setStageProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Sync mode changes to localStorage
  const toggleHealMode = (newMode) => {
    setAutoHealMode(newMode);
    localStorage.setItem('clustermind-autoheal-mode', newMode);
    addToast('Healing Mode Switched', `Mode set to ${newMode === 'auto' ? 'Autonomous Auto-Heal' : 'Manual Operator Approval'}`, 'var(--cyan)');
  };

  // Find target high-risk node or fallback to critical node
  const incidentNodeId = incident?.node || nodes.find(n => n.risk >= 65 || n.status === 'critical')?.id || 'gpu-worker-02';
  const targetNodeId = incident?.target || 'gpu-worker-01';
  const hasActiveIncident = incident !== null || nodes.some(n => n.risk >= 65 || n.status === 'critical');

  // Autonomous healing progress ticker when in auto mode
  useEffect(() => {
    if (!hasActiveIncident) {
      setActiveStage(1);
      setStageProgress(0);
      setIsExecuting(false);
      return;
    }

    if (autoHealMode === 'auto') {
      setIsExecuting(true);
      const timer = setInterval(() => {
        setStageProgress(prev => {
          if (prev >= 100) {
            setActiveStage(current => {
              if (current >= 6) {
                clearInterval(timer);
                completeHealing();
                return 6;
              }
              return current + 1;
            });
            return 0;
          }
          return prev + 25;
        });
      }, 400);

      return () => clearInterval(timer);
    }
  }, [hasActiveIncident, autoHealMode]);

  // Handle Manual Approval Execution by Admin
  const handleManualApprove = async () => {
    setIsExecuting(true);
    setActiveStage(1);
    setStageProgress(0);

    for (let stage = 1; stage <= 6; stage++) {
      setActiveStage(stage);
      setStageProgress(50);
      await new Promise(r => setTimeout(r, 400));
      setStageProgress(100);
      await new Promise(r => setTimeout(r, 200));
    }

    await completeHealing();
    setIsExecuting(false);
    addToast('Self-Healing Completed', `Workloads successfully migrated from ${incidentNodeId} → ${targetNodeId}`, 'var(--green)');
  };

  if (!hasActiveIncident) {
    return (
      <article className="panel healing-panel" style={{ gridColumn: 'span 3', border: '1px solid var(--border)' }}>
        <div className="panel-header">
          <div>
            <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--green)' }} />
              <span>Self-Healing Engine</span>
            </p>
            <h2 className="panel-title">Autonomous Workload Migration Pipeline</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="filter-pills" role="group" aria-label="Auto-heal mode toggle">
              <button
                className={`pill ${autoHealMode === 'auto' ? 'active' : ''}`}
                onClick={() => toggleHealMode('auto')}
              >
                Auto-Heal
              </button>
              <button
                className={`pill ${autoHealMode === 'manual' ? 'active' : ''}`}
                onClick={() => toggleHealMode('manual')}
              >
                Manual Admin
              </button>
            </div>
            <button className="btn-ghost-sm" onClick={() => injectScenario('thermal')} title="Simulate anomaly to test healing">
              <Zap style={{ width: '13px', height: '13px', color: 'var(--amber)' }} />
              <span>Simulate Anomaly</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text)', display: 'block' }}>All Cluster Nodes Operating Nominally</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Self-healing engine monitoring IsolationForest telemetry vectors. 0 active migrations required.</small>
            </div>
          </div>
          <span className="pill active" style={{ background: 'var(--green-glow)', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 700 }}>
            🟢 Engine Standby · 100% Ready
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="panel healing-panel healing-panel-active" style={{ gridColumn: 'span 3', border: '1px solid var(--amber)', background: 'color-mix(in srgb, var(--amber) 4%, var(--surface))' }}>
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)' }}>
            <ShieldAlert style={{ width: '15px', height: '15px', color: 'var(--amber)' }} />
            <span>AI Self-Healing &amp; Workload Migration Center</span>
          </p>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Incident Recovery: {incidentNodeId} → {targetNodeId}</span>
            <span className="risk-active-badge" style={{ background: 'var(--amber-glow)', color: 'var(--amber)' }}>
              {autoHealMode === 'auto' ? '⚡ Autonomous Auto-Heal' : '🛡️ Admin Manual Approval'}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="filter-pills" role="group" aria-label="Auto-heal mode toggle">
            <button
              className={`pill ${autoHealMode === 'auto' ? 'active' : ''}`}
              onClick={() => toggleHealMode('auto')}
            >
              Auto Mode
            </button>
            <button
              className={`pill ${autoHealMode === 'manual' ? 'active' : ''}`}
              onClick={() => toggleHealMode('manual')}
            >
              Manual Admin
            </button>
          </div>

          {autoHealMode === 'manual' && (
            <button
              className="btn btn-primary"
              onClick={handleManualApprove}
              disabled={isExecuting}
              style={{ background: 'var(--green)', padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              {isExecuting ? <RefreshCw className="spin" style={{ width: '14px', height: '14px' }} /> : <Play style={{ width: '14px', height: '14px', fill: 'currentColor' }} />}
              <span>{isExecuting ? 'Migrating Workloads...' : 'Approve & Execute Self-Healing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 6-Stage Interactive Stepper Pipeline */}
      <div className="healing-stepper-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginTop: '14px' }}>
        {HEALING_STAGES.map((stage) => {
          const isDone = activeStage > stage.id;
          const isCurrent = activeStage === stage.id;
          const isPending = activeStage < stage.id;

          let stepColor = 'var(--text-muted)';
          let borderColor = 'var(--border)';
          let bgColor = 'var(--surface)';

          if (isDone) {
            stepColor = 'var(--green)';
            borderColor = 'var(--green)';
            bgColor = 'color-mix(in srgb, var(--green) 12%, transparent)';
          } else if (isCurrent) {
            stepColor = 'var(--cyan)';
            borderColor = 'var(--cyan)';
            bgColor = 'color-mix(in srgb, var(--cyan) 18%, transparent)';
          }

          return (
            <div
              key={stage.id}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                position: 'relative',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: stepColor }}>PHASE 0{stage.id}</span>
                {isDone ? (
                  <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--green)' }} />
                ) : isCurrent ? (
                  <RefreshCw className="spin" style={{ width: '14px', height: '14px', color: 'var(--cyan)' }} />
                ) : (
                  <Lock style={{ width: '12px', height: '12px', color: 'var(--text-dim)' }} />
                )}
              </div>

              <strong style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text)', marginBottom: '4px' }}>
                {stage.title}
              </strong>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                {stage.detail}
              </p>

              {/* Progress bar inside active step */}
              {isCurrent && (
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stageProgress}%`, background: 'var(--cyan)', transition: 'width 0.2s linear' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Process Migration Detail Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
            Migrating active process state from <strong className="font-mono" style={{ color: 'var(--amber)' }}>{incidentNodeId}</strong> → <strong className="font-mono" style={{ color: 'var(--green)' }}>{targetNodeId}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Checkpoint Size: <strong>1.4 GB</strong></span>
          <span>Zero-Downtime Guarantee: <strong>100%</strong></span>
          <button className="btn-ghost-sm" onClick={completeHealing} style={{ color: 'var(--green)', border: '1px solid var(--green)' }}>
            Force Instant Resolve
          </button>
        </div>
      </div>
    </article>
  );
}
