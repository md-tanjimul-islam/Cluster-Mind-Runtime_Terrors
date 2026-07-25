import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Sun, Moon, Volume2, VolumeX, PanelLeftClose, PanelLeftOpen, Menu, Settings, LogOut, Shield } from 'lucide-react';

export function Topbar({ onMobileMenuToggle }) {
  const { user, logout, theme, toggleTheme, sound, toggleSound, sidebarMini, toggleSidebar, setActiveModal } = useCluster();
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
        {/* Desktop: sidebar toggle */}
        <button
          className="icon-btn topbar-desktop-only"
          onClick={toggleSidebar}
          title={sidebarMini ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar width"
        >
          {sidebarMini ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>

        {/* Mobile: hamburger menu */}
        <button
          className="icon-btn topbar-mobile-only"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu />
        </button>

        <a href="#" className="brand" aria-label="ClusterMind Operations Center">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span>Cluster<span>Mind</span></span>
        </a>
      </div>

      <div className="topbar-center topbar-center-hide-mobile">
        <span className="live-dot" aria-hidden="true"></span>
        <span>AI Telemetry Active</span>
        <span className="divider" aria-hidden="true"></span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{timeStr}</span>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* User Auth Profile Badge */}
        {user && (
          <div 
            className="topbar-user-badge" 
            title={`Authenticated as ${user.name} (${user.email})`}
          >
            <span className="topbar-user-avatar">{user.avatar || '🛡️'}</span>
            <div className="topbar-user-info topbar-center-hide-mobile">
              <strong className="topbar-user-name">{user.name}</strong>
              <small className="topbar-user-role">{user.role}</small>
            </div>
          </div>
        )}

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

        <button
          className="icon-btn"
          onClick={() => setActiveModal('settings')}
          title="Open Customization & Stability Settings"
          aria-label="Open settings"
        >
          <Settings />
        </button>

        {/* Log Out / Lock Session Button */}
        <button
          className="icon-btn"
          onClick={logout}
          title="Lock Session / Sign Out of Gateway"
          aria-label="Sign out"
          style={{ color: 'var(--red, #ff5f56)', borderColor: 'rgba(255, 95, 86, 0.3)' }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </header>
  );
}
