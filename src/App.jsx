import React, { useState } from 'react';
import { useCluster } from './context/ClusterContext';
import { LoginPage } from './components/auth/LoginPage';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Hero } from './components/dashboard/Hero';
import { MetricsGrid } from './components/dashboard/MetricsGrid';
import { NodeGrid } from './components/dashboard/NodeGrid';
import { RiskPanel } from './components/dashboard/RiskPanel';
import { JobsPanel } from './components/dashboard/JobsPanel';
import { ActivityLog } from './components/dashboard/ActivityLog';
import { ImpactChart } from './components/dashboard/ImpactChart';
import { HealingProcessPanel } from './components/dashboard/HealingProcessPanel';
import { SuccessReportWidget } from './components/dashboard/SuccessReportWidget';

import { ConnectNodeModal } from './components/modals/ConnectNodeModal';
import { TopologyModal } from './components/modals/TopologyModal';
import { ExplainModal } from './components/modals/ExplainModal';
import { DemoModal } from './components/modals/DemoModal';
import { NodeDetailsModal } from './components/modals/NodeDetailsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App() {
  const { isAuthenticated, toasts } = useCluster();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginPage />
        {/* Toast Region */}
        <div className="toast-region" role="status" aria-live="polite">
          {toasts.map(toast => (
            <div key={toast.id} className="toast" style={{ '--tc': toast.color }}>
              <strong>{toast.title}</strong>
              <small>{toast.detail}</small>
            </div>
          ))}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Ambient background glows */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-1"></div>
        <div className="ambient-blob ambient-2"></div>
      </div>

      <Topbar onMobileMenuToggle={() => setMobileMenuOpen(o => !o)} />
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main id="main">
        <Hero />
        <MetricsGrid />
        <ErrorBoundary><SuccessReportWidget /></ErrorBoundary>

        <section className="dashboard-grid" aria-label="Dashboard panels">
          <ErrorBoundary><HealingProcessPanel /></ErrorBoundary>
          <ErrorBoundary><NodeGrid /></ErrorBoundary>
          <ErrorBoundary><RiskPanel /></ErrorBoundary>
          <ErrorBoundary><JobsPanel /></ErrorBoundary>
          <ErrorBoundary><ActivityLog /></ErrorBoundary>
          <ErrorBoundary><ImpactChart /></ErrorBoundary>
        </section>
      </main>

      {/* Modals */}
      <ConnectNodeModal />
      <TopologyModal />
      <ExplainModal />
      <DemoModal />
      <NodeDetailsModal />
      <SettingsModal />

      {/* Toast Region */}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className="toast" style={{ '--tc': toast.color }}>
            <strong>{toast.title}</strong>
            <small>{toast.detail}</small>
          </div>
        ))}
      </div>
    </ErrorBoundary>
  );
}
export default App;
