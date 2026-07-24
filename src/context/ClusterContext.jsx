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
  const [toasts, setToasts] = useState([]);

  // UI Controls & Filters
  const [theme, setTheme] = useState(localStorage.getItem('clustermind-theme') || 'dark');
  const [sound, setSound] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(localStorage.getItem('clustermind-sidebar') === 'mini');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.nodes) {
            setNodes(prevNodes => {
              const serverNodeIds = new Set(data.nodes.map(n => n.id.toLowerCase()));
              const localCustomNodes = prevNodes.filter(n => !serverNodeIds.has(n.id.toLowerCase()));
              const merged = [...data.nodes, ...localCustomNodes];
              
              // Persist local custom nodes in localStorage
              const customToSave = merged.filter(n => n.source === 'real' || n.source === 'demo');
              try {
                localStorage.setItem('clustermind-custom-nodes', JSON.stringify(customToSave));
              } catch {}
              return merged;
            });
          }
          if (data.incident !== undefined) setIncident(data.incident);
          if (data.impact) setImpact(data.impact);
          if (data.activity) setActivity(data.activity);
          if (data.workloads) setWorkloadJobs(data.workloads);
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
    const pollSpeed = parseInt(localStorage.getItem('clustermind-poll-interval')) || 2000;
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

  // Auto-Healing Complete Action connected to FastAPI
  const completeHealing = async () => {
    try {
      await fetch(`${API_BASE}/api/heal`, { method: 'POST' });
    } catch {}

    setIncident(null);
    setNodes(prev => prev.map(n => n.id === 'gpu-worker-02' ? { ...n, temp: 62, ram: 54, cpu: 45, risk: 14, status: 'healthy' } : n));
    setImpact(prev => ({ ...prev, prevented: prev.prevented + 1, savings: prev.savings + 1180 }));
    setActivity(prev => [
      { type: 'shield', title: 'Self-healing completed', detail: 'gpu-worker-02 restored in 24s · 0 data loss', time: 'Just now' },
      ...prev
    ]);
    addToast('Incident Resolved', 'Workloads rebalanced across healthy nodes', 'var(--green)');
    playSound(880, 0.25);
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
    try {
      await fetch(`${API_BASE}/api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId })
      });
    } catch {}

    setNodes(prev => {
      const updated = prev.filter(n => n.id !== nodeId);
      try {
        const customToSave = updated.filter(n => n.source === 'real' || n.source === 'demo');
        localStorage.setItem('clustermind-custom-nodes', JSON.stringify(customToSave));
      } catch {}
      return updated;
    });

    addToast('Node Revoked', `${nodeId} removed and token revoked`, 'var(--red)');
  };

  return (
    <ClusterContext.Provider value={{
      nodes, setNodes,
      incident, setIncident,
      impact, setImpact,
      activity, setActivity,
      workloadJobs, setWorkloadJobs,
      toasts, addToast,
      theme, setTheme, toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
      sound, setSound, toggleSound: () => setSound(prev => !prev),
      sidebarMini, setSidebarMini, toggleSidebar: () => setSidebarMini(prev => !prev),
      statusFilter, setStatusFilter,
      jobFilter, setJobFilter,
      searchQuery, setSearchQuery,
      activeModal, setActiveModal,
      selectedNodeId, setSelectedNodeId,
      selectedRiskNodeId, setSelectedRiskNodeId,
      demoStep, setDemoStep,
      injectScenario, completeHealing, addNode, deleteNode, playSound
    }}>
      {children}
    </ClusterContext.Provider>
  );
}

export const useCluster = () => useContext(ClusterContext);
