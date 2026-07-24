import React, { useState } from 'react';
import { useCluster } from '../../context/ClusterContext';

export function ImpactChart() {
  const { addToast } = useCluster();
  const [range, setRange] = useState('7');

  const selectRange = (r) => {
    setRange(r);
    addToast(`${r}D Impact Window`, 'Protection timeline range updated', 'var(--cyan)');
  };

  return (
    <article className="panel impact-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Impact</p>
          <h2 className="panel-title">Protection over time</h2>
        </div>
        <div className="range-toggle" role="group" aria-label="Chart range">
          {['7', '30', '90'].map(r => (
            <button
              key={r}
              className={`range-btn ${range === r ? 'active' : ''}`}
              onClick={() => selectRange(r)}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap" aria-label="Cumulative cost savings chart">
        <div className="chart-y" aria-hidden="true">
          <span>$12K</span><span>$8K</span><span>$4K</span><span>$0</span>
        </div>
        <svg className="chart-svg" viewBox="0 0 600 190" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line className="c-grid" x1="0" y1="10" x2="600" y2="10" />
          <line className="c-grid" x1="0" y1="63" x2="600" y2="63" />
          <line className="c-grid" x1="0" y1="116" x2="600" y2="116" />
          <line className="c-grid" x1="0" y1="170" x2="600" y2="170" />
          <path className="c-area" d="M0 162 C66 158 75 138 128 136 S200 108 250 114 S320 74 375 82 S450 52 490 58 S554 18 600 26 L600 190 L0 190Z" />
          <path className="c-line" d="M0 162 C66 158 75 138 128 136 S200 108 250 114 S320 74 375 82 S450 52 490 58 S554 18 600 26" />
          <g className="c-pts">
            <circle cx="128" cy="136" r="4" />
            <circle cx="250" cy="114" r="4" />
            <circle cx="375" cy="82" r="4" />
            <circle cx="490" cy="58" r="4" />
            <circle cx="600" cy="26" r="4" />
          </g>
        </svg>
        <div className="chart-x" aria-hidden="true">
          <span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
        </div>
      </div>
    </article>
  );
}
