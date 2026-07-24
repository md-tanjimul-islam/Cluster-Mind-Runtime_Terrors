import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { HelpCircle, Brain, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';

export function ExplainModal() {
  const { activeModal, setActiveModal } = useCluster();

  if (activeModal !== 'explain') return null;

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-lg modal-explain-lg modal-nextgen" onClick={e => e.stopPropagation()}>
        <div className="modal-glowing-border" aria-hidden="true"></div>
        <button className="modal-close" onClick={() => setActiveModal('none')} aria-label="Close modal">×</button>

        <header className="modal-head modal-head-nextgen">
          <div className="modal-head-badge">
            <span className="live-dot" aria-hidden="true"></span>
            <span>EXPLAINABLE AI ENGINE</span>
          </div>

          <div className="modal-head-main">
            <div className="modal-head-icon-lg" aria-hidden="true">
              <Brain />
            </div>
            <div>
              <span className="eyebrow-tech">ANOMALY DETECTION MODEL</span>
              <h2 className="modal-title-tech">How ClusterMind Predicts Failures</h2>
              <p className="modal-head-sub">IsolationForest multi-vector analysis catches system anomalies 38 minutes early.</p>
            </div>
          </div>
        </header>

        <div className="explain-flow">
          <div className="explain-card">
            <div className="explain-num">1</div>
            <h3>Multi-Signal Ingestion</h3>
            <p>Streams CPU, RAM, disk IOPS, network jitter, GPU temp &amp; utilization every 5s into a 6D telemetry vector.</p>
          </div>
          <div className="explain-arrow" aria-hidden="true">
            <ArrowRight />
          </div>

          <div className="explain-card">
            <div className="explain-num">2</div>
            <h3>IsolationForest AI</h3>
            <p>Measures isolation path lengths to detect non-linear anomaly clusters without static thresholds.</p>
          </div>
          <div className="explain-arrow" aria-hidden="true">
            <ArrowRight />
          </div>

          <div className="explain-card">
            <div className="explain-num">3</div>
            <h3>Predictive Self-Healing</h3>
            <p>Triggers checkpointing &amp; migration at 70% risk — preventing downtime 30–60 minutes before physical crash.</p>
          </div>
        </div>

        {/* Competitive Comparison Table */}
        <div className="compare-box">
          <h4 className="compare-head">Why ClusterMind Beats Traditional Monitoring</h4>
          <div className="compare-grid">
            <div className="compare-col compare-old">
              <div className="compare-col-header">
                <AlertOctagon style={{ color: 'var(--red)' }} />
                <span className="compare-tag">Traditional (Grafana / Datadog)</span>
              </div>
              <ul>
                <li>❌ Single-metric static thresholds (e.g. Temp &gt; 85°C)</li>
                <li>❌ Fires alerts <em>after</em> system is already crashing</li>
                <li>❌ Requires human on-call engineer intervention</li>
                <li>❌ 45+ minutes average cluster downtime</li>
              </ul>
            </div>

            <div className="compare-col compare-new">
              <div className="compare-col-header">
                <ShieldCheck style={{ color: 'var(--cyan)' }} />
                <span className="compare-tag tag-cyan">ClusterMind AI Self-Healing</span>
              </div>
              <ul>
                <li>✅ Multi-signal anomaly vectors (6 combined metrics)</li>
                <li>✅ Predicts failure <strong>38 minutes before</strong> crash</li>
                <li>✅ 100% autonomous 6-phase checkpoint &amp; migrate</li>
                <li>✅ <strong>24-second recovery with 0 data loss</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="explain-note">
          <b>Real-World Benchmark:</b> A GPU temperature of 78°C appears normal in isolation. However, when paired with rising RAM pressure and dropping GPU utilization, ClusterMind identifies an imminent thermal throttle cascade before standard threshold alerts ever fire.
        </div>

        <footer className="modal-foot-nextgen">
          <div></div>
          <button className="btn btn-primary btn-nextgen-primary" onClick={() => setActiveModal('none')}>
            <span>Understood &amp; Close</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
