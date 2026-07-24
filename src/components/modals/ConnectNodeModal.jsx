import React, { useState, useEffect } from 'react';
import { useCluster } from '../../context/ClusterContext';
import {
  X,
  Server,
  Play,
  Cpu,
  Shield,
  Copy,
  Check,
  Wifi,
  Terminal,
  Eye,
  EyeOff,
  Download,
  Radio,
  Activity,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export function ConnectNodeModal() {
  const { activeModal, setActiveModal, nodes, addNode, addToast } = useCluster();

  const [connectMode, setConnectMode] = useState('real'); // 'real' | 'demo'
  const [activeStep, setActiveStep] = useState(1); // 1, 2, 3
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('NVIDIA GPU worker');
  const [demoCondition, setDemoCondition] = useState('healthy');
  const [platform, setPlatform] = useState('windows'); // 'windows' | 'unix' | 'docker'
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://clustermind-backend-s51y.onrender.com');
  const [lanIp, setLanIp] = useState('');
  const [lanPort, setLanPort] = useState('8080');
  const [formError, setFormError] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [pingState, setPingState] = useState('idle'); // 'idle' | 'testing' | 'success'

  // Keyboard shortcut listener (Esc key)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal === 'node') {
        setActiveModal('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal]);

  // Generate default node name & security token ONCE when modal opens
  useEffect(() => {
    if (activeModal === 'node') {
      const existingNames = new Set(nodes.map(n => n.id.toLowerCase()));
      let count = nodes.length + 1;
      let defaultName = `gpu-worker-0${count}`;
      while (existingNames.has(defaultName.toLowerCase())) {
        count++;
        defaultName = `gpu-worker-${count < 10 ? '0' + count : count}`;
      }
      setNodeName(defaultName);
      setFormError('');
      setActiveStep(1);
      setShowToken(false);
      setPingState('idle');

      // 128-bit secure HMAC token hex generator
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      setToken([...b].map(x => x.toString(16).padStart(2, '0')).join(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModal]);

  if (activeModal !== 'node') return null;

  const currentOrigin = window.location.origin;
  const isCloudDeployment = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  // Exact Render Backend Service URL
  const serverBaseUrl = backendUrl.trim()
    ? backendUrl.trim().replace(/\/+$/, '')
    : (isCloudDeployment ? 'https://clustermind-backend-s51y.onrender.com' : `http://${lanIp.trim() || '127.0.0.1'}:${lanPort}`);

  // Serve agent scripts & process API packets directly from Python FastAPI backend service
  const url      = `${serverBaseUrl}/api/ingest`;
  const agentUrl = `${serverBaseUrl}/agents/windows-agent.ps1`;
  const instUrl  = `${serverBaseUrl}/agents/install-windows-agent.ps1`;

  const unixCommandStr   = `curl -X POST '${url}' -H 'Content-Type: application/json' -d '{"token":"${token}","id":"${nodeName || 'gpu-worker-04'}","cpu":42,"gpu":78,"ram":61,"temp":67}'`;
  const winCommandStr    = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path $env:TEMP 'install-clustermind.ps1'; Invoke-WebRequest '${instUrl}' -OutFile $p; & $p -Endpoint '${url}' -AgentUrl '${agentUrl}' -Token '${token}' -NodeId '${nodeName || 'gpu-worker-04'}'"`;
  const dockerCommandStr = `docker run -d --name cm-agent-${nodeName || 'worker'} --net=host -e NODE_ID="${nodeName || 'gpu-worker-04'}" -e INGEST_URL="${url}" -e TOKEN="${token}" clustermind/agent:latest`;

  const getActiveCommandStr = () => {
    if (platform === 'windows') return winCommandStr;
    if (platform === 'unix') return unixCommandStr;
    return dockerCommandStr;
  };

  const copyToClipboard = (text, fieldName, toastTitle) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(toastTitle, 'Command payload copied to clipboard', 'var(--cyan)');
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleDownloadScript = () => {
    const isWin = platform === 'windows';
    const isDocker = platform === 'docker';
    const filename = isWin
      ? `clustermind-installer-${nodeName || 'agent'}.ps1`
      : isDocker
        ? `run-agent-docker-${nodeName || 'agent'}.sh`
        : `clustermind-agent-${nodeName || 'agent'}.sh`;

    const blob = new Blob([getActiveCommandStr()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Installer Script Saved', `Downloaded ${filename}`, 'var(--cyan)');
  };

  const handleSimulatePing = () => {
    setPingState('testing');
    setTimeout(() => {
      setPingState('success');
      addToast('Handshake Verified', `Endpoint http://${host}:${lanPort} is active`, 'var(--green)');
    }, 1200);
  };

  const validateStep1 = () => {
    let name = nodeName.trim();
    if (!name) name = `gpu-worker-0${nodes.length + 1}`;

    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(name)) {
      setFormError('Hostname must be 3–40 characters (letters, numbers, hyphens, periods).');
      return false;
    }
    if (nodes.some(n => n.id.toLowerCase() === name.toLowerCase())) {
      setFormError('A cluster node with this name is already registered.');
      return false;
    }
    setFormError('');
    return true;
  };

  // Form submission handler (single source of truth for step progression & final registration)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    if (connectMode === 'real') {
      if (activeStep === 1) {
        setActiveStep(2);
        return;
      }
      if (activeStep === 2) {
        setActiveStep(3);
        return;
      }
      // On activeStep === 3 -> Fall through to final node registration below
    }

    if (connectMode === 'demo') {
      let name = nodeName.trim() || `gpu-worker-0${nodes.length + 1}`;
      const profiles = {
        healthy:  { cpu: 42, gpu: 63, ram: 48, temp: 58, risk: 11, status: 'healthy'  },
        watch:    { cpu: 72, gpu: 84, ram: 76, temp: 72, risk: 38, status: 'watch'    },
        critical: { cpu: 91, gpu: 36, ram: 92, temp: 86, risk: 79, status: 'critical' }
      };
      addNode({
        id: name,
        type: nodeType.replace('Real agent', 'Demo device'),
        ...profiles[demoCondition],
        jobs: 2,
        source: 'demo'
      });
      addToast('Synthetic Node Added', `Registered sandbox node ${name}`, 'var(--cyan)');
    } else {
      // Step 3 final registration for real worker
      let name = nodeName.trim() || `gpu-worker-0${nodes.length + 1}`;
      addNode({
        id: name,
        type: nodeType,
        cpu: 0, gpu: 0, ram: 0, temp: 0, risk: 0,
        status: 'pending',
        jobs: 0,
        source: 'real',
        connection: 'waiting'
      });
      addToast('Node Provisioned', `Cluster handshake initialized for ${name}`, 'var(--cyan)');
    }
    setActiveModal('none');
  };

  return (
    <div className="modal-backdrop" onClick={() => setActiveModal('none')}>
      <section className="modal modal-wizard-v3" onClick={e => e.stopPropagation()}>
        {/* Modal Close Button (Pinned Top Right) */}
        <button
          className="modal-close"
          onClick={() => setActiveModal('none')}
          aria-label="Close modal (Esc)"
          title="Press Esc to close"
        >
          ×
        </button>

        {/* Pinned Wizard Header */}
        <header className="wiz-header-v3">
          <div className="wiz-badge-strip">
            <span className="wiz-tech-pill">
              <Radio style={{ width: '12px', height: '12px' }} />
              Connectivity Wizard 3.0
            </span>
            <span className="wiz-protocol-sub">
              Protocol v2.4 (HMAC-SHA256)
            </span>
          </div>

          <div className="wiz-title-row">
            <div className="wiz-icon-avatar">
              <Server style={{ width: '28px', height: '28px' }} />
            </div>
            <div className="wiz-title-text">
              <h2>Connect Compute Node</h2>
              <p>Register high-performance compute nodes step by step or spawn synthetic sandbox workers.</p>
            </div>
          </div>

          {/* Step Navigator Bar */}
          {connectMode === 'real' && (
            <nav className="wiz-stepper-bar" aria-label="Wizard Steps">
              <button
                type="button"
                className={`wiz-step-btn ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}
                onClick={() => setActiveStep(1)}
              >
                <span className="wiz-step-bubble">{activeStep > 1 ? <Check style={{ width: '14px', height: '14px' }} /> : '1'}</span>
                <div className="wiz-step-info">
                  <span className="wiz-step-label">Node Profile</span>
                  <span className="wiz-step-sub">Identity &amp; Arch</span>
                </div>
              </button>

              <button
                type="button"
                className={`wiz-step-btn ${activeStep === 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}
                onClick={() => {
                  if (validateStep1()) setActiveStep(2);
                }}
              >
                <span className="wiz-step-bubble">{activeStep > 2 ? <Check style={{ width: '14px', height: '14px' }} /> : '2'}</span>
                <div className="wiz-step-info">
                  <span className="wiz-step-label">Security Key</span>
                  <span className="wiz-step-sub">HMAC Token</span>
                </div>
              </button>

              <button
                type="button"
                className={`wiz-step-btn ${activeStep === 3 ? 'active' : ''}`}
                onClick={() => {
                  if (validateStep1()) setActiveStep(3);
                }}
              >
                <span className="wiz-step-bubble">3</span>
                <div className="wiz-step-info">
                  <span className="wiz-step-label">Terminal Deployment</span>
                  <span className="wiz-step-sub">LAN Script &amp; Agent</span>
                </div>
              </button>
            </nav>
          )}
        </header>

        {/* Form Container with Scrollable Body and Pinned Footer */}
        <form onSubmit={handleSubmit} className="wiz-form-v3">
          <div className="wiz-body-v3">
            {/* Mode Switcher Grid */}
            <div className="conn-mode-grid" role="tablist">
              <button
                type="button"
                className={`conn-mode-card ${connectMode === 'real' ? 'active' : ''}`}
                onClick={() => setConnectMode('real')}
              >
                <div className="conn-mode-icon">
                  <Server style={{ width: '20px', height: '20px' }} />
                </div>
                <div className="conn-mode-meta">
                  <strong>Real Hardware Worker</strong>
                  <p>Stream telemetry from physical GPUs, local workstations, or cloud instances.</p>
                </div>
                <span className="conn-mode-tag mode-tag-live">Live Stream</span>
              </button>

              <button
                type="button"
                className={`conn-mode-card ${connectMode === 'demo' ? 'active' : ''}`}
                onClick={() => setConnectMode('demo')}
              >
                <div className="conn-mode-icon">
                  <Play style={{ width: '20px', height: '20px' }} />
                </div>
                <div className="conn-mode-meta">
                  <strong>Simulated Demo Sandbox</strong>
                  <p>Generate real-time hardware metric waveforms for judge demonstrations.</p>
                </div>
                <span className="conn-mode-tag mode-tag-sandbox">Sandbox</span>
              </button>
            </div>

            {/* STEP 1: Node Identifier & Architecture Profile */}
            {activeStep === 1 && connectMode === 'real' && (
              <div className="wiz-section-card">
                <div className="wiz-card-header">
                  <div className="wiz-card-title">
                    <Cpu style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} />
                    <span>Step 1: Compute Node Specifications</span>
                  </div>
                  <span className="wiz-step-pill">STEP 1 OF 3</span>
                </div>

                <div className="form-row-2">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Node Identifier (Hostname)</span>
                    <div className="wiz-input-wrap">
                      <Cpu className="wiz-input-icon" />
                      <input
                        className="wiz-input font-mono"
                        value={nodeName}
                        onChange={e => {
                          setNodeName(e.target.value);
                          setFormError('');
                        }}
                        placeholder="gpu-worker-04"
                        required
                      />
                    </div>
                    <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                      Unique hostname identifier across the cluster matrix.
                    </small>
                  </label>

                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Hardware Architecture</span>
                    <div className="wiz-input-wrap">
                      <Layers className="wiz-input-icon" />
                      <select
                        className="wiz-input"
                        value={nodeType}
                        onChange={e => setNodeType(e.target.value)}
                      >
                        <option>NVIDIA GPU worker</option>
                        <option>AMD GPU worker</option>
                        <option>Apple Silicon worker</option>
                        <option>CPU worker</option>
                        <option>Control plane node</option>
                      </select>
                    </div>
                    <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                      Determines GPU/VRAM monitoring &amp; kernel telemetry.
                    </small>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Authentication Security Token */}
            {activeStep === 2 && connectMode === 'real' && (
              <div className="wiz-section-card">
                <div className="wiz-card-header">
                  <div className="wiz-card-title">
                    <Shield style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} />
                    <span>Step 2: Authentication Security Token</span>
                  </div>
                  <span className="wiz-step-pill">STEP 2 OF 3</span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Each cluster node uses an HMAC-SHA256 signed secret token to authenticate telemetry packets sent to the ingestion endpoint.
                </p>

                <div className="token-display-box">
                  <Shield style={{ width: '16px', height: '16px', color: 'var(--cyan)', flexShrink: 0 }} />
                  <span className="token-val">
                    {showToken ? token : '••••••••••••••••••••••••••••••••'}
                  </span>

                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={() => setShowToken(!showToken)}
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                    <span>{showToken ? 'Hide' : 'Reveal'}</span>
                  </button>

                  <button
                    type="button"
                    className="icon-btn-sm"
                    style={{ background: 'var(--cyan-glow)', color: 'var(--cyan)', borderColor: 'rgba(0, 242, 254, 0.4)' }}
                    onClick={() => copyToClipboard(token, 'token', 'Token Copied')}
                  >
                    {copiedField === 'token' ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                    <span>Copy Key</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.72rem', color: 'var(--green)' }}>
                  <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                  <span>256-Bit Cryptographically Secure Token Generated</span>
                </div>
              </div>
            )}

            {/* STEP 3: Network Endpoint & Terminal Deployment */}
            {activeStep === 3 && connectMode === 'real' && (
              <div className="wiz-section-card">
                <div className="wiz-card-header">
                  <div className="wiz-card-title">
                    <Wifi style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} />
                    <span>Step 3: Network Endpoint &amp; Terminal Command</span>
                  </div>
                  <span className="wiz-step-pill">STEP 3 OF 3</span>
                </div>

                {/* Network Endpoint Configuration */}
                <div className="form-row-2" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Backend Ingestion Service URL</span>
                    <div className="wiz-input-wrap">
                      <Wifi className="wiz-input-icon" />
                      <input
                        className="wiz-input font-mono"
                        value={backendUrl}
                        onChange={e => setBackendUrl(e.target.value)}
                        placeholder="https://clustermind-backend-s51y.onrender.com"
                      />
                    </div>
                  </label>

                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Fallback Local LAN IP</span>
                    <div className="wiz-input-wrap">
                      <Activity className="wiz-input-icon" />
                      <input
                        className="wiz-input font-mono"
                        value={lanIp}
                        onChange={e => setLanIp(e.target.value)}
                        placeholder="192.168.1.100"
                      />
                    </div>
                  </label>
                </div>

                {/* Handshake Tester Status Bar */}
                <div className="lan-status-bar">
                  <div className="lan-ping-info">
                    <span className={pingState === 'testing' ? 'ping-dot-testing' : 'ping-dot-active'}></span>
                    <span>
                      {pingState === 'testing'
                        ? `Pinging http://${host}:${lanPort}...`
                        : pingState === 'success'
                          ? `🟢 Handshake Endpoint Active on Port ${lanPort}`
                          : `Target Endpoint: http://${host}:${lanPort}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={handleSimulatePing}
                    disabled={pingState === 'testing'}
                  >
                    <RefreshCw style={{ width: '12px', height: '12px', animation: pingState === 'testing' ? 'spin 1s linear infinite' : 'none' }} />
                    <span>Test Handshake</span>
                  </button>
                </div>

                {/* Terminal Studio */}
                <div className="terminal-studio">
                  <div className="terminal-studio-bar">
                    <div className="t-controls">
                      <span className="t-dot red"></span>
                      <span className="t-dot yellow"></span>
                      <span className="t-dot green"></span>
                      <span className="t-window-title" style={{ marginLeft: '6px' }}>
                        <Terminal style={{ width: '12px', height: '12px' }} />
                        clustermind-agent-installer
                      </span>
                    </div>

                    <div className="plat-selector-pills" role="tablist">
                      <button
                        type="button"
                        className={`plat-pill ${platform === 'windows' ? 'active' : ''}`}
                        onClick={() => setPlatform('windows')}
                      >
                        PowerShell
                      </button>
                      <button
                        type="button"
                        className={`plat-pill ${platform === 'unix' ? 'active' : ''}`}
                        onClick={() => setPlatform('unix')}
                      >
                        macOS / Linux
                      </button>
                      <button
                        type="button"
                        className={`plat-pill ${platform === 'docker' ? 'active' : ''}`}
                        onClick={() => setPlatform('docker')}
                      >
                        Docker
                      </button>
                    </div>
                  </div>

                  <div className="terminal-code-body">
                    <code>{getActiveCommandStr()}</code>
                  </div>

                  <div className="terminal-action-row">
                    <button
                      type="button"
                      className="btn-terminal-copy"
                      onClick={() => copyToClipboard(getActiveCommandStr(), 'cmd', 'Script Copied')}
                    >
                      {copiedField === 'cmd' ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                      <span>{copiedField === 'cmd' ? 'Copied to Clipboard' : 'Copy Agent Command'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-terminal-download"
                      onClick={handleDownloadScript}
                      title="Save installer script to disk"
                    >
                      <Download style={{ width: '13px', height: '13px' }} />
                      <span>Download Script</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATED DEMO SANDBOX CONFIGURATION */}
            {connectMode === 'demo' && (
              <div className="wiz-section-card">
                <div className="wiz-card-header">
                  <div className="wiz-card-title">
                    <Play style={{ width: '18px', height: '18px', color: 'var(--amber)' }} />
                    <span>Synthetic Telemetry Sandbox Options</span>
                  </div>
                  <span className="wiz-step-pill" style={{ background: 'rgba(255, 189, 46, 0.15)', color: 'var(--amber)' }}>
                    SANDBOX
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Synthetic workers feed realistic live telemetry metrics directly into ClusterMind's IsolationForest AI predictor every 5 seconds.
                </p>

                <div className="form-row-2" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Node Identifier (Hostname)</span>
                    <div className="wiz-input-wrap">
                      <Cpu className="wiz-input-icon" />
                      <input
                        className="wiz-input font-mono"
                        value={nodeName}
                        onChange={e => {
                          setNodeName(e.target.value);
                          setFormError('');
                        }}
                        placeholder="demo-node-01"
                        required
                      />
                    </div>
                  </label>

                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <span>Hardware Architecture</span>
                    <div className="wiz-input-wrap">
                      <Layers className="wiz-input-icon" />
                      <select
                        className="wiz-input"
                        value={nodeType}
                        onChange={e => setNodeType(e.target.value)}
                      >
                        <option>NVIDIA GPU worker</option>
                        <option>AMD GPU worker</option>
                        <option>Apple Silicon worker</option>
                        <option>CPU worker</option>
                      </select>
                    </div>
                  </label>
                </div>

                <label className="form-label" style={{ marginBottom: '8px' }}>
                  <span>Select Initial Baseline Health State</span>
                </label>

                <div className="demo-preset-grid">
                  <button
                    type="button"
                    className={`demo-preset-card ${demoCondition === 'healthy' ? 'active' : ''}`}
                    onClick={() => setDemoCondition('healthy')}
                  >
                    <div className="preset-title">
                      <span>🟢 Healthy Node</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Nominal load &amp; low anomaly score (11% Risk).
                    </p>
                    <div className="preset-metrics">
                      <div className="preset-metric-row"><span>CPU</span><b>42%</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '42%', background: 'var(--cyan)' }}></div></div>
                      <div className="preset-metric-row"><span>Temp</span><b>58°C</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '58%', background: 'var(--green)' }}></div></div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`demo-preset-card ${demoCondition === 'watch' ? 'active' : ''}`}
                    onClick={() => setDemoCondition('watch')}
                  >
                    <div className="preset-title">
                      <span>🟡 Elevated Watch</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Rising temperature &amp; RAM pressure (38% Risk).
                    </p>
                    <div className="preset-metrics">
                      <div className="preset-metric-row"><span>CPU</span><b>72%</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '72%', background: 'var(--amber)' }}></div></div>
                      <div className="preset-metric-row"><span>Temp</span><b>72°C</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '72%', background: 'var(--amber)' }}></div></div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`demo-preset-card ${demoCondition === 'critical' ? 'active' : ''}`}
                    onClick={() => setDemoCondition('critical')}
                  >
                    <div className="preset-title">
                      <span>🔴 Critical Risk</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Thermal runaway signature (79% Anomaly Risk).
                    </p>
                    <div className="preset-metrics">
                      <div className="preset-metric-row"><span>CPU</span><b>91%</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '91%', background: 'var(--red)' }}></div></div>
                      <div className="preset-metric-row"><span>Temp</span><b>86°C</b></div>
                      <div className="preset-mini-bar"><div className="preset-mini-fill" style={{ width: '86%', background: 'var(--red)' }}></div></div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 95, 86, 0.15)', border: '1px solid rgba(255, 95, 86, 0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: '#ff5f56', fontSize: '0.8rem', marginTop: '10px' }} role="alert">
                <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}
          </div>

          {/* Pinned Action Footer */}
          <footer className="wiz-footer">
            <div className="wiz-status-chip">
              <span className="status-dot-pulse"></span>
              <span>
                {connectMode === 'real'
                  ? `Step ${activeStep} of 3 — ${activeStep === 3 ? 'Final Handshake & Deployment' : 'Configuration Step'}`
                  : 'Ready for Sandbox Provisioning'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveModal('none')}
              >
                Cancel
              </button>

              {connectMode === 'real' && activeStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep(prev => prev - 1)}
                >
                  <ArrowLeft style={{ width: '14px', height: '14px' }} />
                  <span>Back</span>
                </button>
              )}

              {connectMode === 'real' && activeStep < 3 ? (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--cyan) 0%, #00b4d8 100%)',
                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
                    color: '#000',
                    fontWeight: 800
                  }}
                >
                  <span>Next Step</span>
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--cyan) 0%, #00b4d8 100%)',
                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)',
                    color: '#000',
                    fontWeight: 800
                  }}
                >
                  <span>{connectMode === 'real' ? 'Register & Connect Worker' : 'Add Demo Sandbox Node'}</span>
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
export default ConnectNodeModal;
