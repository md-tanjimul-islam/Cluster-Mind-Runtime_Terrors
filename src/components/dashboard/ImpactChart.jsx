import React, { useState } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { ShieldCheck, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';

const RANGE_DATA = {
  '7': {
    yMax: '$12.5K',
    points: [
      { day: 'Thu', date: 'Jul 18', savings: '$1,240', prevented: 2, downtime: '14 mins', efficiency: '99.9%', cx: 30,  cy: 162 },
      { day: 'Fri', date: 'Jul 19', savings: '$2,890', prevented: 4, downtime: '32 mins', efficiency: '99.8%', cx: 125, cy: 136 },
      { day: 'Sat', date: 'Jul 20', savings: '$4,150', prevented: 6, downtime: '50 mins', efficiency: '100.0%', cx: 220, cy: 114 },
      { day: 'Sun', date: 'Jul 21', savings: '$6,420', prevented: 9, downtime: '1h 15m', efficiency: '99.9%', cx: 315, cy: 88 },
      { day: 'Mon', date: 'Jul 22', savings: '$8,950', prevented: 12, downtime: '1h 45m', efficiency: '100.0%', cx: 410, cy: 62 },
      { day: 'Tue', date: 'Jul 23', savings: '$10,680', prevented: 14, downtime: '2h 10m', efficiency: '99.9%', cx: 505, cy: 40 },
      { day: 'Wed', date: 'Jul 24', savings: '$12,450', prevented: 16, downtime: '2h 35m', efficiency: '100.0%', cx: 580, cy: 22 }
    ],
    pathArea: 'M0 162 C66 158 75 138 125 136 S200 108 220 114 S300 84 315 88 S390 58 410 62 S490 35 505 40 S554 18 580 22 L580 190 L0 190Z',
    pathLine: 'M0 162 C66 158 75 138 125 136 S200 108 220 114 S300 84 315 88 S390 58 410 62 S490 35 505 40 S554 18 580 22'
  },
  '30': {
    yMax: '$48.0K',
    points: [
      { day: 'Wk 1', date: 'Jul 01 - 07', savings: '$9,800',  prevented: 14, downtime: '2h 10m', efficiency: '99.8%', cx: 40,  cy: 155 },
      { day: 'Wk 2', date: 'Jul 08 - 14', savings: '$22,400', prevented: 31, downtime: '4h 45m', efficiency: '99.9%', cx: 200, cy: 110 },
      { day: 'Wk 3', date: 'Jul 15 - 21', savings: '$36,900', prevented: 49, downtime: '7h 20m', efficiency: '100.0%', cx: 390, cy: 65 },
      { day: 'Wk 4', date: 'Jul 22 - 24', savings: '$48,200', prevented: 64, downtime: '9h 50m', efficiency: '100.0%', cx: 570, cy: 25 }
    ],
    pathArea: 'M0 165 L40 155 L200 110 L390 65 L570 25 L570 190 L0 190Z',
    pathLine: 'M0 165 L40 155 L200 110 L390 65 L570 25'
  },
  '90': {
    yMax: '$142.0K',
    points: [
      { day: 'May', date: 'May 2026', savings: '$41,200',  prevented: 58,  downtime: '8h 30m',  efficiency: '99.7%', cx: 50,  cy: 145 },
      { day: 'Jun', date: 'Jun 2026', savings: '$89,500',  prevented: 124, downtime: '17h 40m', efficiency: '99.9%', cx: 310, cy: 85 },
      { day: 'Jul', date: 'Jul 2026', savings: '$142,800', prevented: 198, downtime: '28h 15m', efficiency: '100.0%', cx: 560, cy: 20 }
    ],
    pathArea: 'M0 170 L50 145 L310 85 L560 20 L560 190 L0 190Z',
    pathLine: 'M0 170 L50 145 L310 85 L560 20'
  }
};

export function ImpactChart() {
  const { addToast } = useCluster();
  const [range, setRange] = useState('7');
  const [hoverIndex, setHoverIndex] = useState(6); // Default active point: latest day

  const activeRange = RANGE_DATA[range] || RANGE_DATA['7'];
  const activePt = activeRange.points[hoverIndex] || activeRange.points[activeRange.points.length - 1];

  const selectRange = (r) => {
    setRange(r);
    setHoverIndex(RANGE_DATA[r].points.length - 1);
    addToast(`${r}D Protection Window`, 'Impact metrics & timeline window updated', 'var(--cyan)');
  };

  return (
    <article className="panel impact-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--cyan)' }} />
            <span>AI Impact Matrix</span>
          </p>
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

      {/* SVG Cumulative Cost Savings Chart */}
      <div className="chart-wrap" aria-label="Cumulative cost savings chart">
        <div className="chart-y" aria-hidden="true">
          <span>{activeRange.yMax}</span>
          <span>$8.0K</span>
          <span>$4.0K</span>
          <span>$0</span>
        </div>

        <div style={{ position: 'relative' }}>
          <svg className="chart-svg" viewBox="0 0 600 190" preserveAspectRatio="none">
            <defs>
              <linearGradient id="impact-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow-circle" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines supporting light & dark theme */}
            <line className="c-grid" x1="0" y1="10" x2="600" y2="10" />
            <line className="c-grid" x1="0" y1="63" x2="600" y2="63" />
            <line className="c-grid" x1="0" y1="116" x2="600" y2="116" />
            <line className="c-grid" x1="0" y1="170" x2="600" y2="170" />

            {/* Area and Line */}
            <path className="c-area" fill="url(#impact-gradient)" d={activeRange.pathArea} />
            <path className="c-line" d={activeRange.pathLine} />

            {/* Interactive Vertical Cursor Guide Line */}
            {activePt && (
              <line
                x1={activePt.cx}
                y1="10"
                x2={activePt.cx}
                y2="170"
                stroke="var(--cyan)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.75"
              />
            )}

            {/* Interactive Data Points */}
            <g className="c-pts">
              {activeRange.points.map((pt, idx) => {
                const isHovered = idx === hoverIndex;
                return (
                  <g
                    key={pt.day}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onClick={() => setHoverIndex(idx)}
                  >
                    {/* Hit target area */}
                    <circle cx={pt.cx} cy={pt.cy} r="14" fill="transparent" />

                    {/* Outer glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r="8"
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="2"
                        filter="url(#glow-circle)"
                      />
                    )}

                    {/* Inner core circle */}
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? '#ffffff' : 'var(--cyan)'}
                      stroke="var(--cyan)"
                      strokeWidth={isHovered ? 2 : 1}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Hover Tooltip Card */}
          {activePt && (
            <div
              className="impact-hover-tooltip"
              style={{
                left: `clamp(10px, ${(activePt.cx / 600) * 100}%, calc(100% - 170px))`
              }}
            >
              <div className="impact-tt-header">
                <strong>{activePt.date}</strong>
                <span className="impact-tt-badge">{activePt.savings} Saved</span>
              </div>
              <div className="impact-tt-body">
                <span>🛡️ {activePt.prevented} Incidents Healed</span>
                <span>⏱️ {activePt.downtime} Avoided</span>
              </div>
            </div>
          )}
        </div>

        <div className="chart-x" aria-hidden="true">
          {activeRange.points.map((pt, idx) => (
            <span
              key={pt.day}
              className={`chart-x-item ${idx === hoverIndex ? 'active' : ''}`}
              onMouseEnter={() => setHoverIndex(idx)}
              style={{ cursor: 'pointer', fontWeight: idx === hoverIndex ? 700 : 500 }}
            >
              {pt.day}
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Detail KPI Callout Bar */}
      <div className="impact-detail-bar">
        <div className="impact-kpi-item">
          <div className="impact-kpi-icon" style={{ background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' }}>
            <DollarSign style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <span className="impact-kpi-label">Cumulative Savings</span>
            <strong className="impact-kpi-val" style={{ color: 'var(--green)' }}>{activePt.savings}</strong>
          </div>
        </div>

        <div className="impact-kpi-item">
          <div className="impact-kpi-icon" style={{ background: 'color-mix(in srgb, var(--cyan) 15%, transparent)', color: 'var(--cyan)' }}>
            <ShieldCheck style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <span className="impact-kpi-label">Incidents Avoided</span>
            <strong className="impact-kpi-val">{activePt.prevented} Spikes</strong>
          </div>
        </div>

        <div className="impact-kpi-item">
          <div className="impact-kpi-icon" style={{ background: 'color-mix(in srgb, var(--violet) 15%, transparent)', color: 'var(--violet)' }}>
            <Clock style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <span className="impact-kpi-label">Downtime Prevented</span>
            <strong className="impact-kpi-val">{activePt.downtime}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
