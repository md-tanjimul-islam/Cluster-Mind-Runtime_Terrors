import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { ShieldAlert, Cpu, CheckCircle2, Play, Lock, RefreshCw, ChevronLeft, ChevronRight, Layers, Zap } from 'lucide-react';

const HEALING_STAGES = [
  { id: 1, title: 'Anomaly Detection', detail: 'IsolationForest ML kernel anomaly trigger' },
  { id: 2, title: 'Vector Inference', detail: '6D Telemetry risk score evaluation' },
  { id: 3, title: 'State Checkpoint', detail: 'Saving active process RAM & PID state' },
  { id: 4, title: 'Target Allocation', detail: 'Selected healthy destination node' },
  { id: 5, title: 'Live Migration', detail: 'Zero-downtime workload stream transfer' },
  { id: 6, title: 'Health Restored', detail: 'Cluster rebalance & audit log saved' }
];

export function HealingProcessPanel() {
  const { nodes, incident, completeHealing, riskThreshold, addToast } = useCluster();

  // Read auto-heal mode setting from localStorage ('auto' | 'manual')
  const [autoHealMode, setAutoHealMode] = useState(() => localStorage.getItem('clustermind-autoheal-mode') || 'auto');
  
  // Track active slide/tab index when multiple nodes are at risk
  const [activeIndex, setActiveIndex] = useState(0);

  // Stepper state per active node
  const [activeStage, setActiveStage] = useState(1);
  const [stageProgress, setStageProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Identify all nodes that require healing / workload migration using dynamic riskThreshold
  const atRiskNodes = nodes.filter(n => 
    n.risk >= riskThreshold || 
    n.status === 'critical' || 
    (incident && incident.node === n.id)
  );

  // CRITICAL REQUIREMENT 1: If there is no node at risk, hide this section completely!
  if (atRiskNodes.length === 0) {
    return null;
  }

  // Ensure activeIndex is within bounds if an incident resolves
  const safeIndex = activeIndex >= atRiskNodes.length ? 0 : activeIndex;
  const currentNode = atRiskNodes[safeIndex] || atRiskNodes[0];

  if (!currentNode) {
    return null;
  }

  // Dynamically allocate healthy target node for active workload migration
  const targetHealthyNode = nodes.find(n => 
    n.id !== currentNode?.id && 
    n.connection !== 'offline' && 
    n.risk < 45
  )?.id || 'gpu-worker-01';

  // Mode Toggle handler
  const toggleHealMode = (newMode) => {
    setAutoHealMode(newMode);
    localStorage.setItem('clustermind-autoheal-mode', newMode);
    addToast('Healing Mode Switched', `Mode set to ${newMode === 'auto' ? 'Autonomous Auto-Heal' : 'Manual Admin Approval'}`, 'var(--cyan)');
  };

  // Autonomous progress ticker when in auto mode
  useEffect(() => {
    if (!currentNode) return;

    if (autoHealMode === 'auto') {
      setIsExecuting(true);
      const timer = setInterval(() => {
        setStageProgress(prev => {
          if (prev >= 100) {
            setActiveStage(current => {
              if (current >= 6) {
                clearInterval(timer);
                completeHealing(currentNode.id);
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
    } else {
      setIsExecuting(false);
    }
  }, [currentNode?.id, autoHealMode]);

  // Handle Manual Approval Execution for current node
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

    await completeHealing(currentNode.id);
    setIsExecuting(false);
  };

  // Handle Healing All At-Risk Nodes concurrently
  const handleHealAll = async () => {
    setIsExecuting(true);
    addToast('Batch Auto-Healing Initiated', `Resolving all ${atRiskNodes.length} at-risk nodes...`, 'var(--amber)');
    for (const node of atRiskNodes) {
      await completeHealing(node.id);
    }
    setIsExecuting(false);
  };

  const handlePrevSlide = () => {
    setActiveIndex(prev => (prev > 0 ? prev - 1 : atRiskNodes.length - 1));
    setActiveStage(1);
    setStageProgress(0);
  };

  const handleNextSlide = () => {
    setActiveIndex(prev => (prev < atRiskNodes.length - 1 ? prev + 1 : 0));
    setActiveStage(1);
    setStageProgress(0);
  };

  return (
    <article className="panel healing-panel healing-panel-active" style={{ border: '1px solid var(--amber)', background: 'color-mix(in srgb, var(--amber) 4%, var(--surface))' }}>
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)' }}>
            <ShieldAlert style={{ width: '15px', height: '15px', color: 'var(--amber)' }} />
            <span>AI Self-Healing &amp; Workload Migration Center</span>
          </p>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>Incident Recovery: <strong className="font-mono" style={{ color: 'var(--amber)' }}>{currentNode.id}</strong> → <strong className="font-mono" style={{ color: 'var(--green)' }}>{targetHealthyNode}</strong></span>
            {currentNode.source === 'real' && (
              <span className="pill active" style={{ background: 'var(--cyan-glow)', color: 'var(--cyan)', fontSize: '0.6875rem' }}>
                📡 Live Physical Device
              </span>
            )}
            <span className="risk-active-badge" style={{ background: 'var(--amber-glow)', color: 'var(--amber)' }}>
              {autoHealMode === 'auto' ? '⚡ Autonomous Auto-Heal' : '🛡️ Manual Admin Approval'}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

          {atRiskNodes.length > 1 && (
            <button
              className="btn-ghost-sm"
              onClick={handleHealAll}
              disabled={isExecuting}
              style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}
            >
              <Zap style={{ width: '13px', height: '13px' }} />
              <span>Heal All ({atRiskNodes.length})</span>
            </button>
          )}

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

      {/* CRITICAL REQUIREMENT 2: Horizontal Carousel / Slider for Multiple At-Risk Nodes */}
      {atRiskNodes.length > 1 && (
        <div className="healing-carousel-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--amber)' }}>
            <Layers style={{ width: '14px', height: '14px' }} />
            <span>Active Migrations ({atRiskNodes.length}):</span>
          </div>

          <div className="healing-tabs-scroll">
            {atRiskNodes.map((n, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={n.id}
                  className={`healing-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveIndex(idx);
                    setActiveStage(1);
                    setStageProgress(0);
                  }}
                >
                  <span className="node-dot" style={{ '--sc': n.risk >= 65 ? 'var(--red)' : 'var(--amber)' }}></span>
                  <span>{n.id}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.85 }}>({n.risk}%)</span>
                </button>
              );
            })}
          </div>

          <div className="healing-carousel-controls">
            <button className="icon-btn" style={{ width: '28px', height: '28px' }} onClick={handlePrevSlide} title="Previous node migration">
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {safeIndex + 1}/{atRiskNodes.length}
            </span>
            <button className="icon-btn" style={{ width: '28px', height: '28px' }} onClick={handleNextSlide} title="Next node migration">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6-Stage Interactive Stepper Pipeline */}
      <div className="healing-stepper-grid">
        {HEALING_STAGES.map((stage) => {
          const isDone = activeStage > stage.id;
          const isCurrent = activeStage === stage.id;

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
              className="healing-step-card"
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
      <div className="healing-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu style={{ width: '16px', height: '16px', color: 'var(--cyan)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>
            Migrating active process state from <strong className="font-mono" style={{ color: 'var(--amber)' }}>{currentNode.id}</strong> → <strong className="font-mono" style={{ color: 'var(--green)' }}>{targetHealthyNode}</strong>
          </span>
        </div>

        <div className="healing-bottom-meta">
          <span>Checkpoint Size: <strong>1.4 GB</strong></span>
          <span>Zero-Downtime: <strong>100%</strong></span>
          <button
            className="btn-ghost-sm"
            onClick={() => completeHealing(currentNode.id)}
            style={{ color: 'var(--green)', border: '1px solid var(--green)' }}
          >
            Force Instant Resolve ({currentNode.id})
          </button>
        </div>
      </div>
    </article>
  );
}

