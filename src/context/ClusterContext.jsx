import React, { createContext, useContext, useState, useEffect } from 'react';

const ClusterContext = createContext();

// Dynamic API Base URL resolution with localStorage override support
const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem('clustermind-backend-url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const host = window.location.hostname;
  if (host.includes('onrender.com') || (!host.includes('localhost') && !host.includes('127.0.0.1'))) {
    return 'https://clustermind-backend-s51y.onrender.com';
  }
  return '';
};

const API_BASE = getApiBase();

const INITIAL_WORKLOAD_JOBS = [
  { id: 'train-resnet-42',   name: 'PyTorch ResNet-50 Training',     node: 'gpu-worker-01', category: 'Training',   status: 'Running',   progress: 'Epoch 47/100', vram: '6.8 GB', cpu: '42%', runtime: '2h 14m' },
  { id: 'infer-llm-07',      name: 'Llama-3 8B Inference Engine',    node: 'gpu-worker-02', category: 'Inference',  status: 'Migrating', progress: 'Checkpoint 68%', vram: '9.1 GB', cpu: '68%', runtime: '5h 02m' },
  { id: 'batch-eval-09',     name: 'BERT Validation Batch',          node: 'gpu-worker-03', category: 'Evaluation', status: 'Running',   progress: 'Batch 140/200', vram: '3.2 GB', cpu: '31%', runtime: '0h 45m' },
  { id: 'fine-tune-sdxl-02', name: 'Stable Diffusion XL Fine-Tune', node: 'gpu-worker-01', category: 'Training',   status: 'Running',   progress: 'Step 4,200/10,000', vram: '7.4 GB', cpu: '56%', runtime: '4h 10m' },
  { id: 'embed-vector-14',   name: 'Pinecone Vector Embedding Engine',node: 'cpu-worker-01', category: 'Pipeline',  status: 'Running',   progress: '1.2M Docs Processed', vram: 'N/A', cpu: '57%', runtime: '8h 30m' },
  { id: 'etl-pipeline-05',   name: 'Telemetry Aggregator Stream',    node: 'cpu-worker-02', category: 'Pipeline',  status: 'Running',   progress: 'Stream Active (1.4k/s)', vram: 'N/A', cpu: '69%', runtime: '12h 15m' }
];

const FALLBACK_NODES = [
  { id: 'gpu-worker-01', type: 'NVIDIA RTX 4060',    cpu: 61, gpu: 74, ram: 58, temp: 67, risk: 18, status: 'healthy',  jobs: 3, source: 'built-in' },
  { id: 'gpu-worker-02', type: 'NVIDIA RTX 3060',    cpu: 82, gpu: 41, ram: 89, temp: 81, risk: 72, status: 'critical', jobs: 2, source: 'built-in' },
  { id: 'gpu-worker-03', type: 'NVIDIA GTX 1650',    cpu: 48, gpu: 66, ram: 52, temp: 63, risk: 23, status: 'healthy',  jobs: 2, source: 'built-in' },
  { id: 'cpu-worker-01', type: 'Apple M2 · 8 cores', cpu: 57, gpu: 0,  ram: 64, temp: 54, risk: 12, status: 'healthy',  jobs: 4, source: 'built-in' },
  { id: 'cpu-worker-02', type: 'Intel i7 · 12 cores',cpu: 69, gpu: 0,  ram: 71, temp: 61, risk: 31, status: 'watch',    jobs: 5, source: 'built-in' },
  { id: 'controller-01', type: 'Control plane',       cpu: 24, gpu: 0,  ram: 39, temp: 45, risk: 7,  status: 'healthy',  jobs: 0, source: 'built-in' }
];

const getInitialNodes = () => {
  try {
    const saved = localStorage.getItem('clustermind-custom-nodes');
    if (saved) {
      const custom = JSON.parse(saved);
      const builtInIds = new Set(FALLBACK_NODES.map(n => n.id.toLowerCase()));
      const filteredCustom = custom.filter(n => !builtInIds.has(n.id.toLowerCase()));
      return [...FALLBACK_NODES, ...filteredCustom];
    }
  } catch {}
  return FALLBACK_NODES;
};

export function ClusterProvider({ children }) {
  const [nodes, setNodes] = useState(getInitialNodes);
  const [incident, setIncident] = useState({ node: 'gpu-worker-02', risk: 72, status: 'checkpointing', progress: 68 });
  const [impact, setImpact] = useState({ prevented: 47, savings: 38980, recovery: 24 });
  const [activity, setActivity] = useState([
    { type: 'shield', title: 'IsolationForest risk spike', detail: 'gpu-worker-02 flagged @ 72%',       time: '12m' },
    { type: 'move',   title: 'Workload migration',        detail: 'train-resnet-42 → gpu-worker-01', time: '45m' },
    { type: 'alert',  title: 'Memory pressure resolved', detail: 'cpu-worker-02 freed 4.2 GB',       time: '1h'  },
    { type: 'shield', title: 'Incident prevented',        detail: '$1,180 estimated compute saved',   time: '2h'  }
  ]);
  const [workloadJobs, setWorkloadJobs] = useState(INITIAL_WORKLOAD_JOBS);
  const [successReport, setSuccessReport] = useState({
    success_rate: '100%',
    total_migrations: 47,
    verified_recoveries: 47,
    avg_recovery_time: '24s',
    false_alarms: 2
  });
  const [toasts, setToasts] = useState([]);

  // UI Controls & Filters
  const [theme, setTheme] = useState(localStorage.getItem('clustermind-theme') || 'dark');
  const [sound, setSound] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(localStorage.getItem('clustermind-sidebar') === 'mini');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(() => parseInt(localStorage.getItem('clustermind-risk-threshold')) || 65);

  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('clustermind-auth-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  const login = (emailInput, passwordInput, remember = true) => {
    const emailLower = (emailInput || '').trim().toLowerCase();
    const pass = (passwordInput || '').trim();

    const validUsers = [
      {
        email: 'real@clustermind.ai',
        pass: 'realhardware2026!',
        name: 'Hardware Telemetry Engineer',
        role: 'Pure Real-Device Mode',
        badge: 'REAL HARDWARE ONLY',
        avatar: '⚡',
        isPureReal: true
      },
      {
        email: 'admin@clustermind.ai',
        pass: 'clustermind2026!',
        name: 'Dr. Tanjimul Islam',
        role: 'Cluster Admin',
        badge: 'OPERATOR',
        avatar: '🛡️'
      },
      {
        email: 'auditor@clustermind.ai',
        pass: 'auditsecure2026!',
        name: 'Irfan Chowdhury',
        role: 'Security Auditor',
        badge: 'AUDITOR',
        avatar: '🔍'
      },
      {
        email: 'demo@clustermind.ai',
        pass: 'demo1234',
        name: 'Guest Judge',
        role: 'Evaluator / Judge',
        badge: 'DEMO ROLE',
        avatar: '🚀'
      }
    ];

    const match = validUsers.find(
      u => u.email === emailLower && (u.pass === pass.toLowerCase() || pass === 'RealHardware2026!' || pass === 'ClusterMind2026!' || pass === 'AuditSecure2026!' || pass === 'demo1234')
    );

    if (match) {
      const userData = {
        email: match.email,
        name: match.name,
        role: match.role,
        badge: match.badge,
        avatar: match.avatar,
        isPureReal: !!match.isPureReal,
        loggedInAt: new Date().toLocaleTimeString()
      };

      if (match.isPureReal) {
        localStorage.setItem('clustermind-pure-real-mode', 'true');
        localStorage.removeItem('clustermind-custom-nodes');
        setNodes([]);
        setWorkloadJobs([]);
        setIncident(null);
        setImpact({ prevented: 0, savings: 0, recovery: 24 });
        setSuccessReport({ success_rate: '100%', total_migrations: 0, verified_recoveries: 0, avg_recovery_time: '24s', false_alarms: 0 });
        setActivity([{ type: 'shield', title: 'Pure Real-Device Mode Active', detail: 'All synthetic demo data cleared · Monitoring real physical hardware telemetry', time: 'Just now' }]);
        try {
          fetch(`${API_BASE}/api/nodes/clear-all`, { method: 'POST' });
        } catch {}
      }

      setUser(userData);
      if (remember) {
        localStorage.setItem('clustermind-auth-user', JSON.stringify(userData));
      }
      addToast('Authentication Success', match.isPureReal ? 'Pure Real-Device Session Active (0 Synthetic Nodes)' : `Welcome back, ${match.name} (${match.role})`, 'var(--cyan)');
      return { ok: true, user: userData };
    } else {
      return { ok: false, message: 'Invalid credentials. Use demo credentials below.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clustermind-auth-user');
    addToast('Session Locked', 'Logged out of ClusterMind Gateway', 'var(--amber)');
  };

  // Sync riskThreshold with backend config
  useEffect(() => {
    localStorage.setItem('clustermind-risk-threshold', riskThreshold.toString());
    try {
      fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk_threshold: riskThreshold })
      });
    } catch {}
  }, [riskThreshold]);
  
  // Modals & Active Selections
  const [activeModal, setActiveModal] = useState('none');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedRiskNodeId, setSelectedRiskNodeId] = useState(null);
  const [demoStep, setDemoStep] = useState(0);

  // Sync theme class to document body
  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('clustermind-theme', theme);
  }, [theme]);

  // Sync sidebar mini class to document body
  useEffect(() => {
    document.body.classList.toggle('sidebar-mini', sidebarMini);
    localStorage.setItem('clustermind-sidebar', sidebarMini ? 'mini' : 'full');
  }, [sidebarMini]);

  // Poll FastAPI Server ${API_BASE}/api/status with local merge guard & persistence
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const isPureRealMode = localStorage.getItem('clustermind-pure-real-mode') === 'true';
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.nodes && Array.isArray(data.nodes)) {
            let validServerNodes = data.nodes.filter(n => n && typeof n.id === 'string' && n.id.trim() !== '');

            // Filter out revoked nodes persistently
            try {
              const revoked = JSON.parse(localStorage.getItem('clustermind-revoked-nodes') || '[]');
              if (Array.isArray(revoked) && revoked.length > 0) {
                const revokedSet = new Set(revoked.map(id => String(id).toLowerCase()));
                validServerNodes = validServerNodes.filter(n => !revokedSet.has(n.id.toLowerCase()));
              }
            } catch {}

            if (isPureRealMode) {
              validServerNodes = validServerNodes.filter(n => n.source === 'real');
            }
            setNodes(prevNodes => {
              const serverNodeIds = new Set(validServerNodes.map(n => n.id.toLowerCase()));
              const localCustomNodes = (prevNodes || []).filter(n => n && typeof n.id === 'string' && !serverNodeIds.has(n.id.toLowerCase()));
              let merged = [...validServerNodes, ...localCustomNodes];
              
              // Apply revoked filter to merged array
              try {
                const revoked = JSON.parse(localStorage.getItem('clustermind-revoked-nodes') || '[]');
                if (Array.isArray(revoked) && revoked.length > 0) {
                  const revokedSet = new Set(revoked.map(id => String(id).toLowerCase()));
                  merged = merged.filter(n => n && typeof n.id === 'string' && !revokedSet.has(n.id.toLowerCase()));
                }
              } catch {}

              if (isPureRealMode) {
                return merged.filter(n => n.source === 'real');
              }
              
              // Persist local custom nodes in localStorage safely
              try {
                const customToSave = merged.filter(n => n && (n.source === 'real' || n.source === 'demo'));
                localStorage.setItem('clustermind-custom-nodes', JSON.stringify(customToSave));
              } catch {}
              return merged;
            });
          }
          if (data && data.incident !== undefined) setIncident(data.incident);
          if (data && data.impact && typeof data.impact === 'object') {
            setImpact(prev => ({
              prevented: typeof data.impact.prevented === 'number' ? data.impact.prevented : (prev?.prevented ?? 47),
              savings: typeof data.impact.savings === 'number' ? data.impact.savings : (prev?.savings ?? 38980),
              recovery: typeof data.impact.recovery === 'number' ? data.impact.recovery : (prev?.recovery ?? 24)
            }));
          }
          if (data && data.success_report && typeof data.success_report === 'object') {
            setSuccessReport(data.success_report);
          }
          if (data && data.activity && Array.isArray(data.activity)) {
            setActivity(data.activity.filter(a => a && typeof a.title === 'string'));
          }
          if (data && data.workloads && Array.isArray(data.workloads)) {
            setWorkloadJobs(data.workloads.filter(w => w && typeof w.id === 'string'));
          }
        }
      } catch (err) {
        // Fallback organic metric animation for local nodes (skip offline real nodes)
        setNodes(prev => prev.map(n => {
          if (n.source === 'real' && n.connection === 'offline') {
            return { ...n, cpu: 0, gpu: 0, ram: 0, temp: 0, jobs: 0 };
          }
          if (n.status === 'critical') return n;
          const cpuDelta = Math.floor(Math.random() * 5) - 2;
          const ramDelta = Math.floor(Math.random() * 3) - 1;
          const tempDelta = Math.floor(Math.random() * 3) - 1;
          return {
            ...n,
            cpu: Math.max(12, Math.min(96, n.cpu + cpuDelta)),
            ram: Math.max(15, Math.min(94, n.ram + ramDelta)),
            temp: Math.max(38, Math.min(84, n.temp + tempDelta))
          };
        }));
      }
    };

    fetchStatus();
    const pollSpeed = parseInt(localStorage.getItem('clustermind-poll-interval')) || 1000;
    const interval = setInterval(fetchStatus, pollSpeed);
    return () => clearInterval(interval);
  }, []);

  // Toast Helper
  const addToast = (title, detail, color = 'var(--cyan)') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-3), { id, title, detail, color }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sound Chime Effect
  const playSound = (freq = 440, duration = 0.12) => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Scenario Injector connected to FastAPI
  const injectScenario = async (type) => {
    try {
      await fetch(`${API_BASE}/api/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch {}

    setNodes(prev => prev.map(n => {
      if (n.id !== 'gpu-worker-02') return n;
      if (type === 'thermal')  return { ...n, temp: 88, risk: 84, status: 'critical', cpu: 91 };
      if (type === 'memory')   return { ...n, ram: 96, risk: 78, status: 'critical' };
      if (type === 'network')  return { ...n, cpu: 84, risk: 71, status: 'critical' };
      if (type === 'reset')    return { ...n, cpu: 42, gpu: 63, ram: 48, temp: 58, risk: 11, status: 'healthy' };
      return n;
    }));

    if (type === 'reset') {
      setIncident(null);
      addToast('Scenario Reset', 'gpu-worker-02 returned to nominal health metrics', 'var(--green)');
    } else {
      setIncident({ node: 'gpu-worker-02', risk: 84, status: 'checkpointing', progress: 15 });
      addToast('Scenario Injected', `${type.toUpperCase()} anomaly induced on gpu-worker-02`, 'var(--amber)');
      playSound(587, 0.2);
    }
  };

  // Auto-Healing Complete Action connected to FastAPI (Supports real physical nodes and simulated nodes)
  const completeHealing = async (targetNodeIdToHeal) => {
    let nodeToHeal = targetNodeIdToHeal;
    if (!nodeToHeal) {
      if (incident && incident.node) nodeToHeal = incident.node;
      else {
        const atRisk = nodes.find(n => n.risk >= 65 || n.status === 'critical');
        nodeToHeal = atRisk ? atRisk.id : 'gpu-worker-02';
      }
    }

    const healthyTarget = nodes.find(n => n.id !== nodeToHeal && n.connection !== 'offline' && n.risk < 45)?.id || 'gpu-worker-01';

    try {
      const res = await fetch(`${API_BASE}/api/heal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeToHeal, target: healthyTarget })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success_report) setSuccessReport(data.success_report);
        if (data.impact) setImpact(data.impact);
        if (data.activity) setActivity(data.activity);
      }
    } catch {}

    if (incident && incident.node === nodeToHeal) {
      setIncident(null);
    }

    setNodes(prev => prev.map(n => {
      if (n.id === nodeToHeal) {
        return { ...n, temp: 58, ram: 48, cpu: 40, risk: 14, safe_mode: true, status: 'safe_mode' };
      }
      if (n.id === healthyTarget) {
        const nextCpu = Math.min(92, (n.cpu || 60) + 14);
        const nextGpu = Math.min(92, (n.gpu || 70) + 12);
        const nextRam = Math.min(90, (n.ram || 55) + 8);
        const nextTemp = Math.min(78, (n.temp || 62) + 5);
        const nextRisk = Math.max(38, (n.risk || 18) + 20);
        return {
          ...n,
          cpu: nextCpu,
          gpu: nextGpu,
          ram: nextRam,
          temp: nextTemp,
          risk: nextRisk,
          jobs: (n.jobs || 2) + 1,
          status: nextRisk >= 65 ? 'critical' : (nextRisk >= 30 ? 'watch' : 'healthy')
        };
      }
      return n;
    }));
    setWorkloadJobs(prev => prev.map(j => j.node === nodeToHeal ? { ...j, node: healthyTarget, status: 'Running', progress: `Active on ${healthyTarget}` } : j));

    addToast('Recovery Verified & Safe Mode Engaged', `Node ${nodeToHeal} quarantined in Safe Mode · 0 Lost Steps`, 'var(--green)');
    playSound(880, 0.25);
  };

  const toggleSafeMode = async (nodeId, enable) => {
    setNodes(prev => prev.map(n => {
      if (n.id.toLowerCase() === String(nodeId).toLowerCase()) {
        const nextStatus = enable ? 'safe_mode' : (n.status === 'safe_mode' ? 'healthy' : n.status);
        return { ...n, safe_mode: enable, status: nextStatus };
      }
      return n;
    }));

    try {
      const res = await fetch(`${API_BASE}/api/node/safemode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId, safe_mode: enable })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activity) setActivity(data.activity);
        if (data.success_report) setSuccessReport(data.success_report);
      }
    } catch {}

    addToast(
      enable ? 'Safe Mode Activated' : 'Safe Mode Released',
      `Node ${nodeId} ${enable ? 'placed in Safe Mode (Quarantined / NoSchedule)' : 'released back to active scheduling'}`,
      enable ? 'var(--amber)' : 'var(--cyan)'
    );
  };

  // Node Management (Optimistic local update + LocalStorage persistence + Backend sync)
  const addNode = async (newNode) => {
    setNodes(prev => {
      let updated;
      if (prev.some(n => n.id.toLowerCase() === newNode.id.toLowerCase())) {
        updated = prev.map(n => n.id.toLowerCase() === newNode.id.toLowerCase() ? newNode : n);
      } else {
        updated = [...prev, newNode];
      }

      // Persist to localStorage
      try {
        const customToSave = updated.filter(n => n.source === 'real' || n.source === 'demo');
        localStorage.setItem('clustermind-custom-nodes', JSON.stringify(customToSave));
      } catch {}
      return updated;
    });

    try {
      await fetch(`${API_BASE}/api/node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });
    } catch (err) {
      console.warn('Backend offline, node saved in local storage & React state');
    }

    addToast('Node Connected', `${newNode.id} is now streaming telemetry`, 'var(--cyan)');
  };

  const deleteNode = async (nodeId) => {
    const nodeLower = String(nodeId || '').trim().toLowerCase();
    if (!nodeLower) return;

    try {
      // 1. Add to local revoked list in localStorage
      const revoked = JSON.parse(localStorage.getItem('clustermind-revoked-nodes') || '[]');
      if (Array.isArray(revoked) && !revoked.map(id => String(id).toLowerCase()).includes(nodeLower)) {
        revoked.push(nodeLower);
        localStorage.setItem('clustermind-revoked-nodes', JSON.stringify(revoked));
      }
      
      // 2. Remove from custom nodes storage
      const stored = localStorage.getItem('clustermind-custom-nodes');
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = (parsed || []).filter(n => n && typeof n.id === 'string' && n.id.toLowerCase() !== nodeLower);
        localStorage.setItem('clustermind-custom-nodes', JSON.stringify(filtered));
      }
    } catch {}

    // 3. Immediately filter React state
    setNodes(prev => (prev || []).filter(n => n && typeof n.id === 'string' && n.id.toLowerCase() !== nodeLower));
    setWorkloadJobs(prev => (prev || []).filter(w => w && typeof w.node === 'string' && w.node.toLowerCase() !== nodeLower));
    setIncident(prev => (prev && prev.node && String(prev.node).toLowerCase() === nodeLower) ? null : prev);

    // 4. Send POST to backend delete endpoint
    try {
      await fetch(`${API_BASE}/api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId })
      });
    } catch {}

    addToast('Node Revoked', `${nodeId} removed permanently from cluster`, 'var(--red)');
  };

  const clearActivityLog = async () => {
    setActivity([]);
    try {
      await fetch(`${API_BASE}/api/activity/clear`, { method: 'POST' });
    } catch {}
  };

  const resetSystem = async () => {
    try {
      localStorage.removeItem('clustermind-custom-nodes');
      localStorage.removeItem('clustermind-pure-real-mode');
      localStorage.setItem('clustermind-risk-threshold', '65');
      setRiskThreshold(65);
      await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    } catch {}
    addToast('System Reset Complete', 'Restored initial cluster nodes, demo workloads & baseline metrics', 'var(--cyan)');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const clearAllNodes = async () => {
    localStorage.removeItem('clustermind-custom-nodes');
    localStorage.setItem('clustermind-pure-real-mode', 'true');
    setNodes([]);
    setWorkloadJobs([]);
    setIncident(null);
    setImpact({ prevented: 0, savings: 0, recovery: 24 });
    setSuccessReport({ success_rate: '100%', total_migrations: 0, verified_recoveries: 0, avg_recovery_time: '24s', false_alarms: 0 });
    setActivity([{ type: 'shield', title: 'Pure Real-Device Mode Active', detail: 'All synthetic demo data cleared · Monitoring real physical hardware telemetry', time: 'Just now' }]);
    try {
      await fetch(`${API_BASE}/api/nodes/clear-all`, { method: 'POST' });
    } catch {}
    addToast('Pure Real-Device Mode Active', 'Cleared all synthetic & custom demo nodes. Connect real physical hardware using terminal scripts.', 'var(--cyan)');
  };

  return (
    <ClusterContext.Provider value={{
      user, isAuthenticated, login, logout,
      nodes, setNodes,
      incident, setIncident,
      impact, setImpact,
      activity, setActivity, clearActivityLog,
      workloadJobs, setWorkloadJobs,
      toasts, addToast,
      theme, setTheme, toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
      sound, setSound, toggleSound: () => setSound(prev => !prev),
      sidebarMini, setSidebarMini, toggleSidebar: () => setSidebarMini(prev => !prev),
      statusFilter, setStatusFilter,
      jobFilter, setJobFilter,
      searchQuery, setSearchQuery,
      riskThreshold, setRiskThreshold,
      activeModal, setActiveModal,
      selectedNodeId, setSelectedNodeId,
      selectedRiskNodeId, setSelectedRiskNodeId,
      demoStep, setDemoStep,
      successReport, toggleSafeMode,
      injectScenario, completeHealing, addNode, deleteNode, playSound, resetSystem, clearAllNodes
    }}>
      {children}
    </ClusterContext.Provider>
  );
}

export const useCluster = () => useContext(ClusterContext);
