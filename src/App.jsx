import React from 'react';
import { useCluster } from './context/ClusterContext';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Hero } from './components/dashboard/Hero';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { NodeGrid } from './components/dashboard/NodeGrid';
import { RiskPanel } from './components/dashboard/RiskPanel';
import { JobsPanel } from './components/dashboard/JobsPanel';
import { ActivityLog } from './components/dashboard/ActivityLog';
import { ImpactChart } from './components/dashboard/ImpactChart';

import { ConnectNodeModal } from './components/modals/ConnectNodeModal';
import { TopologyModal } from './components/modals/TopologyModal';
import { ExplainModal } from './components/modals/ExplainModal';
import { DemoModal } from './components/modals/DemoModal';
import { NodeDetailsModal } from './components/modals/NodeDetailsModal';

export function App() {
  const { toasts } = useCluster();

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Ambient background glows */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-1"></div>
        <div className="ambient-blob ambient-2"></div>
      </div>

      <Topbar />
      <Sidebar />

      <main id="main">
        <Hero />
        <MetricsGrid />

        <section className="dashboard-grid" aria-label="Dashboard panels">
          <NodeGrid />
          <RiskPanel />
          <JobsPanel />
          <ActivityLog />
          <ImpactChart />
        </section>
      </main>

      {/* Modals */}
      <ConnectNodeModal />
      <TopologyModal />
      <ExplainModal />
      <DemoModal />
      <NodeDetailsModal />

      {/* Toast Region */}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className="toast" style={{ '--tc': toast.color }}>
            <strong>{toast.title}</strong>
            <small>{toast.detail}</small>
          </div>
        ))}
      </div>
    </>
  );
}
export default App;
