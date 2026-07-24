import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { LayoutGrid, Server, ShieldAlert, Cpu, TrendingUp, Play, X } from 'lucide-react';

export function Sidebar({ mobileOpen, onMobileClose }) {
  const { nodes, incident, workloadJobs, setActiveModal, setDemoStep } = useCluster();
  const [activeTab, setActiveTab] = useState('overview');

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && onMobileClose) onMobileClose();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onMobileClose]);

  const scrollToView = (tab, selector) => {
    setActiveTab(tab);
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (onMobileClose) onMobileClose(); // close on mobile after nav
  };

  const launchDemo = () => {
    setDemoStep(0);
    setActiveModal('demo');
    if (onMobileClose) onMobileClose();
  };

  // Calculate cluster health
  const healthPct = nodes.length ? Math.round(100 - nodes.reduce((acc, n) => acc + n.risk, 0) / nodes.length) : 100;

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
        aria-label="Primary navigation"
      >
        {/* Mobile close button */}
        <button
          className="sidebar-mobile-close"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>

        <nav>
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => scrollToView('overview', '.hero')}
          >
            <LayoutGrid />
            <span className="nav-label">Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'nodes' ? 'active' : ''}`}
            onClick={() => scrollToView('nodes', '.node-panel')}
          >
            <Server />
            <span className="nav-label">Nodes</span>
            <b className="nav-badge">{nodes.length}</b>
          </button>

          <button
            className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => scrollToView('incidents', '.incident-panel')}
          >
            <ShieldAlert />
            <span className="nav-label">Incidents</span>
            <b className={`nav-badge ${incident ? 'alert' : ''}`}>{incident ? 1 : 0}</b>
          </button>

          <button
            className={`nav-item ${activeTab === 'workloads' ? 'active' : ''}`}
            onClick={() => scrollToView('workloads', '#jobsPanel')}
          >
            <Cpu />
            <span className="nav-label">Workloads</span>
            <b className="nav-badge">{workloadJobs.length}</b>
          </button>

          <button
            className={`nav-item ${activeTab === 'impact' ? 'active' : ''}`}
            onClick={() => scrollToView('impact', '.impact-panel')}
          >
            <TrendingUp />
            <span className="nav-label">Impact</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="demo-btn" onClick={launchDemo} aria-label="Launch 90-second judge demo">
            <Play style={{ fill: 'currentColor' }} />
            <span className="nav-label">Judge demo</span>
          </button>

          <div className="health-widget">
            <div className="health-widget-top">
              <span className="nav-label">System health</span>
              <strong>{healthPct}%</strong>
            </div>
            <div className="health-track">
              <span style={{ width: `${healthPct}%` }}></span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
