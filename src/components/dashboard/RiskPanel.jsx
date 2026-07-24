import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Zap } from 'lucide-react';

export function RiskPanel() {
  const { nodes, selectedRiskNodeId, setSelectedRiskNodeId, injectScenario } = useCluster();

  let riskNode = null;
  if (selectedRiskNodeId) {
    riskNode = nodes.find(n => n.id === selectedRiskNodeId);
  }
  if (!riskNode) {
    riskNode = [...nodes].sort((a,b) => b.risk - a.risk)[0] || nodes[0];
  }

  if (!riskNode) return null;

  const confidence = Math.min(98, Math.round(72 + riskNode.risk * 0.3));
  const sc = riskNode.risk >= 65 ? 'var(--red)' : riskNode.risk >= 30 ? 'var(--amber)' : 'var(--green)';
  const labelText  = riskNode.risk >= 65 ? 'Elevated Risk' : riskNode.risk >= 30 ? 'Under Watch' : 'Nominal';
  const labelClass = riskNode.risk >= 65 ? 'tag-critical'  : riskNode.risk >= 30 ? 'tag-watch'   : 'tag-healthy';

  const GAUGE_C = 2 * Math.PI * 55; // ~345.4
  const offset  = GAUGE_C * (1 - riskNode.risk / 100);

  return (
    <article className="panel risk-panel" id="riskPanel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">AI Brain</p>
          <h2 className="panel-title">
            Risk forecast
            <span className="risk-active-badge">
              {selectedRiskNodeId ? `${riskNode.id}` : 'Highest Risk'}
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedRiskNodeId && (
            <button className="btn-ghost-sm" onClick={() => setSelectedRiskNodeId(null)}>
              Reset selection
            </button>
          )}
          <span className="model-badge">IsolationForest v2.4</span>
        </div>
      </div>

      <div className="risk-layout">
        <div className="gauge-wrap" aria-label={`Risk score: ${riskNode.risk} percent`}>
          <svg className="gauge-svg" viewBox="0 0 130 130">
            <circle className="gauge-track" cx="65" cy="65" r="55" />
            <circle
              className="gauge-fill"
              cx="65" cy="65" r="55"
              style={{
                stroke: sc,
                strokeDasharray: GAUGE_C,
                strokeDashoffset: offset
              }}
            />
          </svg>
          <div className="gauge-center">
            <span className="gauge-val" style={{ color: sc }}>{riskNode.risk}%</span>
            <span className="gauge-sub">RISK SCORE</span>
          </div>
        </div>

        <div>
          <span className={`status-tag ${labelClass}`}>{labelText}</span>
          <p className="risk-node">{riskNode.id}</p>
          <p className="risk-info">
            {riskNode.risk >= 65
              ? 'Multi-signal anomaly vector indicates impending failure within 38 minutes.'
              : riskNode.risk >= 30
              ? 'Elevated metric drift detected. Monitoring closely for checkpoint triggers.'
              : 'All telemetry metrics operating within nominal baseline parameters.'}
          </p>
          <div className="confidence">
            <div className="conf-track">
              <div className="conf-fill" style={{ width: `${confidence}%` }}></div>
            </div>
            <div className="conf-label">
              IsolationForest confidence <b>{confidence}%</b>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly 6D Vector Signals */}
      <div className="signal-list">
        <div className="signal-row">
          <span>CPU utilization</span>
          <div className="sig-bar"><div className="sig-fill" style={{ width: `${riskNode.cpu}%`, '--sc': sc }}></div></div>
          <span className="sig-val" style={{ '--sc': sc }}>{riskNode.cpu}%</span>
        </div>
        <div className="signal-row">
          <span>{riskNode.gpu ? 'GPU utilization' : 'RAM usage'}</span>
          <div className="sig-bar"><div className="sig-fill" style={{ width: `${riskNode.gpu || riskNode.ram}%`, '--sc': sc }}></div></div>
          <span className="sig-val" style={{ '--sc': sc }}>{riskNode.gpu || riskNode.ram}%</span>
        </div>
        <div className="signal-row">
          <span>Thermal status</span>
          <div className="sig-bar"><div className="sig-fill" style={{ width: `${riskNode.temp}%`, '--sc': sc }}></div></div>
          <span className="sig-val" style={{ '--sc': sc }}>{riskNode.temp}°C</span>
        </div>
      </div>

      {/* Failure Scenario Injector Strip */}
      <div className="injector-strip">
        <div className="injector-title">
          <Zap />
          <span>Failure Scenario Injector (Judge Demo)</span>
        </div>
        <div className="injector-btns">
          <button className="inj-btn inj-thermal" onClick={() => injectScenario('thermal')}>
            Thermal Runaway
          </button>
          <button className="inj-btn inj-memory" onClick={() => injectScenario('memory')}>
            Memory Leak
          </button>
          <button className="inj-btn inj-network" onClick={() => injectScenario('network')}>
            Network Jitter
          </button>
          <button className="inj-btn inj-reset" onClick={() => injectScenario('reset')}>
            Reset Nominal
          </button>
        </div>
      </div>
    </article>
  );
}
