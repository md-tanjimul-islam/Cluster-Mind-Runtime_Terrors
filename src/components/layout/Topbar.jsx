import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Sun, Moon, Volume2, VolumeX, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Topbar() {
  const { theme, toggleTheme, sound, toggleSound, sidebarMini, toggleSidebar } = useCluster();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="icon-btn"
          onClick={toggleSidebar}
          title={sidebarMini ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar width"
        >
          {sidebarMini ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>

        <a href="#" className="brand" aria-label="ClusterMind Operations Center">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span>Cluster<span>Mind</span></span>
        </a>
      </div>

      <div className="topbar-center">
        <span className="live-dot" aria-hidden="true"></span>
        <span>AI Telemetry Active</span>
        <span className="divider" aria-hidden="true"></span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{timeStr}</span>
      </div>

      <div className="topbar-actions">
        <button
          className={`icon-btn ${sound ? 'active' : ''}`}
          onClick={toggleSound}
          title={sound ? "Mute alert sounds" : "Enable alert sounds"}
          aria-label="Toggle audio feedback"
        >
          {sound ? <Volume2 /> : <VolumeX />}
        </button>

        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>

        <div className="avatar" title="Runtime Terrors Operator" aria-label="User avatar">
          RT
        </div>
      </div>
    </header>
  );
}
