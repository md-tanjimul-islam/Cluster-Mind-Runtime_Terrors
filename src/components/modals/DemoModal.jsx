import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Play, CheckCircle } from 'lucide-react';

const DEMO_STEPS = [
  { text: 'IsolationForest evaluates 6 live signals — CPU 82%, RAM 89%, Temp 81°C, GPU utilization drop, network jitter, and disk latency — and produces a composite anomaly score of -0.312, crossing the -0.28 trigger threshold. Risk reaches 72%. Auto-heal policy HP-07 fires 38 minutes before projected failure.', btn: '② Isolate & checkpoint' },
  { text: 'gpu-worker-02 is immediately tainted NoSchedule to block new jobs. ClusterMind freezes both active jobs at a clean epoch boundary, then streams 2.56 GB of model weights, optimizer state, and epoch cursors to shared NFS storage. SHA-256 hash is computed for tamper-proof transfer verification.', btn: '③ Migrate workload' },
  { text: 'The scheduler scores every healthy node by VRAM headroom, CPU load, and risk score. gpu-worker-01 wins: risk 18%, 9.2 GB VRAM free. The verified checkpoint is transferred at 3.1 GB/s and replayed from exactly epoch 47, batch 1,204 — zero compute wasted.', btn: '④ Verify & audit' },
  { text: 'A warm-up forward pass confirms the L2 output distance is 0.0003 (well below ε = 0.001). All health gates pass. The full 6-phase incident is recorded in the audit trail: 24-second recovery, zero bytes lost, $1,180 in avoided downtime cost saved.', btn: 'Finish demo' }
];

export function DemoModal() {
  const { activeModal, setActiveModal, demoStep, setDemoStep, completeHealing } = useCluster();

  if (activeModal !== 'demo') return null;

  const currentStep = DEMO_STEPS[demoStep] || DEMO_STEPS[0];

  const nextStep = () => {
    if (demoStep < 3) {
      setDemoStep(prev => prev + 1);
    } else {
      setActiveModal('none');
      completeHealing();
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-nextgen" onClick={e => e.stopPropagation()}>
        <div className="modal-glowing-border" aria-hidden="true"></div>
        <button className="modal-close" onClick={() => setActiveModal('none')} aria-label="Close demo">×</button>

        <header className="modal-head modal-head-nextgen">
          <div className="modal-head-badge">
            <span className="live-dot" aria-hidden="true"></span>
            <span>90-SECOND JUDGE DEMO</span>
          </div>

          <div className="modal-head-main">
            <div className="modal-head-icon-lg" aria-hidden="true">
              <Play />
            </div>
            <div>
              <span className="eyebrow-tech">FAILURE SIMULATION SIMULATOR</span>
              <h2 className="modal-title-tech">Autonomous Self-Healing Demo</h2>
              <p className="modal-head-sub">Interactive walkthrough of predictive detection, checkpointing, and migration.</p>
            </div>
          </div>
        </header>

        <p className="demo-step-text" style={{ minHeight: '76px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {currentStep.text}
        </p>

        <div className="demo-stage">
          <div className="demo-visual" aria-live="polite">
            {demoStep <= 1 ? (
              <>
                <div className="demo-node-chip healthy">01</div>
                <span className="demo-arrow">→</span>
                <div className="demo-node-chip critical">02</div>
                <span className="demo-arrow">→</span>
                <div className="demo-node-chip healthy">03</div>
              </>
            ) : demoStep === 2 ? (
              <>
                <div className="demo-node-chip healthy">02</div>
                <span className="demo-arrow">checkpoint →</span>
                <div className="demo-node-chip healthy">01</div>
              </>
            ) : (
              <>
                <div className="demo-node-chip healthy" style={{ fontSize: '1.25rem' }}>✓</div>
                <span className="demo-arrow">24 sec · zero loss · $1,180 saved</span>
              </>
            )}
          </div>

          <div className="demo-prog-wrap">
            <div className="demo-prog-bar" style={{ width: `${(demoStep + 1) * 25}%` }}></div>
          </div>

          <div className="demo-steps-row" aria-label="Demo steps">
            <span className={demoStep >= 0 ? 'active' : ''}>Predict</span>
            <span className={demoStep >= 1 ? 'active' : ''}>Checkpoint</span>
            <span className={demoStep >= 2 ? 'active' : ''}>Migrate</span>
            <span className={demoStep >= 3 ? 'active' : ''}>Verify</span>
          </div>
        </div>

        <footer className="modal-foot-nextgen">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
            Step {demoStep + 1} of 4
          </span>
          <button className="btn btn-primary btn-nextgen-primary" onClick={nextStep}>
            <span>{currentStep.btn}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
