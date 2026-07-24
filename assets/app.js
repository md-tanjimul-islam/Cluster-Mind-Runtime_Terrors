/* =====================================================
   ClusterMind – Frontend Controller
   Optimised for instant response, no render delays
   ===================================================== */
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ── State ────────────────────────────────────────────
let state = {
  nodes:        [],
  incident:     null,
  impact:       { prevented: 47, savings: 38980, recovery: 24 },
  activity:     [],
  sound:        false,
  demoStep:     0,
  tick:         0,
  searchQuery:  '',
  statusFilter: 'all',
  jobFilter:    'all'
};
let connectMode   = 'real';
let selectedNodeId = null;
let selectedRiskNodeId = null;

// ── Workload Jobs Dataset ─────────────────────────────
const WORKLOAD_JOBS = [
  { id: 'train-resnet-42',   name: 'PyTorch ResNet-50 Training',     node: 'gpu-worker-01', category: 'Training',   status: 'Running',   progress: 'Epoch 47/100', vram: '6.8 GB', cpu: '42%', runtime: '2h 14m' },
  { id: 'infer-llm-07',      name: 'Llama-3 8B Inference Engine',    node: 'gpu-worker-02', category: 'Inference',  status: 'Migrating', progress: 'Checkpoint 68%', vram: '9.1 GB', cpu: '68%', runtime: '5h 02m' },
  { id: 'batch-eval-09',     name: 'BERT Validation Batch',          node: 'gpu-worker-03', category: 'Evaluation', status: 'Running',   progress: 'Batch 140/200', vram: '3.2 GB', cpu: '31%', runtime: '0h 45m' },
  { id: 'fine-tune-sdxl-02', name: 'Stable Diffusion XL Fine-Tune', node: 'gpu-worker-01', category: 'Training',   status: 'Running',   progress: 'Step 4,200/10,000', vram: '7.4 GB', cpu: '56%', runtime: '4h 10m' },
  { id: 'embed-vector-14',   name: 'Pinecone Vector Embedding Engine',node: 'cpu-worker-01', category: 'Pipeline',  status: 'Running',   progress: '1.2M Docs Processed', vram: 'N/A', cpu: '57%', runtime: '8h 30m' },
  { id: 'etl-pipeline-05',   name: 'Telemetry Aggregator Stream',    node: 'cpu-worker-02', category: 'Pipeline',  status: 'Running',   progress: 'Stream Active (1.4k/s)', vram: 'N/A', cpu: '69%', runtime: '12h 15m' },
  { id: 'whisper-speech-01',  name: 'Whisper-v3 Speech Transcriber',  node: 'cpu-worker-01', category: 'Inference',  status: 'Running',   progress: '18 Streams Active', vram: 'N/A', cpu: '44%', runtime: '1h 50m' },
  { id: 'checkpoint-sync-08',name: 'NFS Snapshot Replicator',        node: 'controller-01', category: 'Pipeline',  status: 'Standby',   progress: 'Sync Nominal', vram: 'N/A', cpu: '12%', runtime: '24h 00m' }
];

// ── SVG icons (shared) ───────────────────────────────
const ICON = {
  shield: `<svg viewBox="0 0 24 24"><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  alert:  `<svg viewBox="0 0 24 24"><path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></svg>`,
  move:   `<svg viewBox="0 0 24 24"><path d="M5 9h11l-3-3m3 3-3 3M19 15H8l3-3m-3 3 3 3"/></svg>`,
  brain:  `<svg viewBox="0 0 24 24"><path d="M9.5 4A3.5 3.5 0 0 0 6 7.5c0 .2 0 .4.1.6A3.5 3.5 0 0 0 4 11.3c0 1.4.8 2.7 2 3.3V16a4 4 0 0 0 4 4h2V4H9.5ZM14.5 4A3.5 3.5 0 0 1 18 7.5c0 .2 0 .4-.1.6a3.5 3.5 0 0 1 2.1 3.2c0 1.4-.8 2.7-2 3.3V16a4 4 0 0 1-4 4h-2V4h2.5Z"/></svg>`,
  check:  `<svg viewBox="0 0 24 24"><path d="m7 12 3 3 7-7"/></svg>`
};

// ── Risk colour helpers ──────────────────────────────
function riskColor(risk)  { return risk >= 65 ? 'var(--red)'   : risk >= 30 ? 'var(--amber)' : 'var(--green)'; }
function barColor(value)  { return value >= 80 ? 'var(--red)'  : value >= 65 ? 'var(--amber)' : 'var(--cyan)'; }

// ── Data loading ─────────────────────────────────────
async function loadState() {
  try {
    const res = await fetch('api.php?action=status', { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    state = { ...state, ...data };
    mergeLocalDemoNodes();
  } catch {
    state.nodes    = fallbackNodes();
    state.incident = { node: 'gpu-worker-02', risk: 72, status: 'checkpointing', progress: 68 };
    state.impact   = { prevented: 47, savings: 38980, recovery: 24 };
    state.activity = fallbackActivity();
    const el = $('#streamStatus');
    if (el) el.textContent = 'Demo telemetry';
  }
  render();
}

function mergeLocalDemoNodes() {
  const local = JSON.parse(localStorage.getItem('clustermind-demo-nodes') || '[]');
  const known = new Set(state.nodes.map(n => n.id));
  state.nodes.push(...local.filter(n => !known.has(n.id)));
}

function fallbackNodes() {
  return [
    { id:'gpu-worker-01', type:'NVIDIA RTX 4060',    cpu:61, gpu:74, ram:58, temp:67, risk:18, status:'healthy',  jobs:3 },
    { id:'gpu-worker-02', type:'NVIDIA RTX 3060',    cpu:82, gpu:41, ram:89, temp:81, risk:72, status:'critical', jobs:2 },
    { id:'gpu-worker-03', type:'NVIDIA GTX 1650',    cpu:48, gpu:66, ram:52, temp:63, risk:23, status:'healthy',  jobs:2 },
    { id:'cpu-worker-01', type:'Apple M2 · 8 cores', cpu:57, gpu:0,  ram:64, temp:54, risk:12, status:'healthy',  jobs:4 },
    { id:'cpu-worker-02', type:'Intel i7 · 12 cores',cpu:69, gpu:0,  ram:71, temp:61, risk:31, status:'watch',    jobs:5 },
    { id:'controller-01', type:'Control plane',       cpu:24, gpu:0,  ram:39, temp:45, risk:7,  status:'healthy',  jobs:0 }
  ];
}

function fallbackActivity() {
  return [
    { type:'alert',  title:'Early anomaly detected',    detail:'gpu-worker-02 · risk rose to 72%',          time:'Now' },
    { type:'brain',  title:'Model baseline updated',    detail:'1,240 new telemetry windows learned',        time:'4m'  },
    { type:'move',   title:'Workload migrated safely',  detail:'train-resnet-42 · zero data loss',           time:'2h'  },
    { type:'shield', title:'Incident prevented',        detail:'$1,180 estimated compute saved',             time:'2h'  }
  ];
}

// ── Main render ──────────────────────────────────────
function render() {
  let riskNode = null;
  if (selectedRiskNodeId) {
    riskNode = state.nodes.find(n => n.id === selectedRiskNodeId);
  }
  if (!riskNode) {
    selectedRiskNodeId = null;
    riskNode = [...state.nodes].sort((a,b) => b.risk - a.risk)[0] || state.nodes[0];
  }

  const n = state.nodes.length;
  const avgLoad = n ? Math.round(state.nodes.reduce((s,x) => s + x.cpu, 0) / n) : 0;
  const health  = n ? Math.round(100 - state.nodes.reduce((s,x) => s + x.risk, 0) / n) : 100;

  setText('#nodeCountBadge', n);
  setText('#heroNodeCount',  `${n} node${n === 1 ? '' : 's'}`);
  setText('#clusterLoad',    `${avgLoad}%`);
  setText('#loadDelta',      `Balanced across ${n} nodes`);
  setText('#healthPercent',  `${health}%`);
  setStyle('#healthBar', 'width', `${health}%`);
  setText('#preventedCount', state.impact.prevented.toLocaleString());
  setText('#savings',        `$${state.impact.savings.toLocaleString()}`);
  setText('#recoveryTime',   `${state.impact.recovery} sec`);
  setText('#lastUpdate',     `Updated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`);

  const hour = new Date().getHours();
  setText('#greeting', hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

  renderNodes(riskNode?.id);
  if (riskNode) renderRisk(riskNode, Boolean(selectedRiskNodeId));
  renderActivity();
  renderJobs();
  if (state.incident) updateIncident(state.incident);
}

// ── Workload Jobs Renderer ────────────────────────────
function renderJobs() {
  const container = $('#jobGridList');
  if (!container) return;

  const filter = state.jobFilter || 'all';
  const filtered = filter === 'all' ? WORKLOAD_JOBS : WORKLOAD_JOBS.filter(j => j.category === filter);

  setText('#totalJobsPill', `${WORKLOAD_JOBS.length} Active`);
  setText('#jobCountBadge', String(WORKLOAD_JOBS.length));

  if (!filtered.length) {
    container.innerHTML = `<div class="nodes-empty">No active workloads found in category "${esc(filter)}".</div>`;
    return;
  }

  container.innerHTML = filtered.map(job => {
    const isMigrating = job.status === 'Migrating';
    const statusClass = isMigrating ? 'status-migrating' : job.status === 'Running' ? 'status-running' : 'status-standby';
    const catClass    = ({ Training:'cat-train', Inference:'cat-infer', Evaluation:'cat-eval', Pipeline:'cat-pipe' })[job.category] || 'cat-gen';

    return `
      <div class="job-card ${isMigrating ? 'job-card-warn' : ''}">
        <div class="job-left">
          <div class="job-icon ${catClass}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="m7 8 3 3-3 3M13 14h4"/></svg>
          </div>
          <div>
            <div class="job-title-row">
              <strong class="job-id">${esc(job.id)}</strong>
              <span class="job-cat-tag ${catClass}">${esc(job.category)}</span>
            </div>
            <span class="job-name">${esc(job.name)}</span>
          </div>
        </div>

        <div class="job-meta">
          <div class="job-meta-item">
            <span class="meta-label">Node Placement</span>
            <span class="meta-val font-mono">${esc(job.node)}</span>
          </div>
          <div class="job-meta-item">
            <span class="meta-label">Progress / Phase</span>
            <span class="meta-val">${esc(job.progress)}</span>
          </div>
          <div class="job-meta-item">
            <span class="meta-label">Uptime</span>
            <span class="meta-val font-mono">${esc(job.runtime)}</span>
          </div>
          <div class="job-meta-item">
            <span class="meta-label">Status</span>
            <span class="job-status-pill ${statusClass}">${isMigrating ? '⚡ ' : '🟢 '}${esc(job.status)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Tiny DOM helpers (avoid repeated querySelector) ──
function setText(sel, val) { const el = $(sel); if (el) el.textContent = val; }
function setStyle(sel, prop, val) { const el = $(sel); if (el) el.style[prop] = val; }

// ── Node grid ────────────────────────────────────────
function getFilteredNodes() {
  return state.nodes.filter(node => {
    const q = state.searchQuery.trim().toLowerCase();
    if (q && !node.id.toLowerCase().includes(q) && !(node.type||'').toLowerCase().includes(q)) return false;
    if (state.statusFilter === 'all')  return true;
    if (state.statusFilter === 'real') return node.source === 'real';
    return node.status === state.statusFilter;
  });
}

function renderNodes(selectedRiskId) {
  const grid = $('#nodeGrid');
  if (!grid) return;
  const filtered = getFilteredNodes();

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="nodes-empty">No nodes match your filter criteria.</div>`;
    return;
  }

  // Build HTML string — one innerHTML call (fastest DOM update)
  grid.innerHTML = filtered.map(node => nodeCardHTML(node, node.id === selectedRiskId)).join('');
}

function nodeCardHTML(node, isSelected = false) {
  const sc   = riskColor(node.risk);
  const isGpu = node.gpu || (node.type||'').toLowerCase().match(/gpu|rtx|gtx/);
  const midBar = isGpu ? metricBarHTML('GPU', node.gpu || 0, barColor(node.gpu || 0))
                       : metricBarHTML('RAM', node.ram,     barColor(node.ram));
  const conn = node.source === 'real' ? (node.connection || (node.lastSeen ? 'offline' : 'waiting')) : 'online';
  const srcClass = conn === 'online' ? 'src-online' : conn === 'offline' ? 'src-offline' : 'src-waiting';

  const assignedJobs = WORKLOAD_JOBS.filter(j => j.node === node.id);
  const jobsPillsHTML = assignedJobs.length ? `
    <div class="node-jobs-pills">
      ${assignedJobs.map(j => `<span class="node-job-badge ${j.status === 'Migrating' ? 'migrating' : ''}" title="${esc(j.name)}">${esc(j.id)}</span>`).join('')}
    </div>
  ` : '';

  return `<article class="node-card ${node.risk >= 65 ? 'risk-critical' : ''} ${isSelected ? 'selected-risk-card' : ''} ${node.source ? 'has-src' : ''}" data-node-card-id="${esc(node.id)}" style="--sc:${sc}">
    <div class="node-top">
      <div class="node-ident">
        <span class="node-dot"></span>
        <div>
          <strong>${esc(node.id)}</strong>
          <small>${esc(node.type || '')}</small>
        </div>
      </div>
      <div class="node-risk">${node.risk}<span>%</span></div>
    </div>
    <div class="node-bars">
      ${metricBarHTML('CPU',  node.cpu,  barColor(node.cpu))}
      ${midBar}
      ${metricBarHTML('TEMP', node.temp, barColor(node.temp))}
    </div>
    ${jobsPillsHTML}
    <div class="node-foot">
      <span>${node.jobs} active job${node.jobs === 1 ? '' : 's'}</span>
      <button class="node-details-btn" data-node-details="${esc(node.id)}">View details</button>
    </div>
    ${node.source ? `<span class="src-pill ${srcClass}"><i></i>${conn}</span>` : ''}
  </article>`;
}

function metricBarHTML(label, value, color) {
  return `<div class="bar-item">
    <div class="bar-head">${label}<b>${value}${label === 'TEMP' ? '°' : '%'}</b></div>
    <div class="mini-bar"><div class="mini-fill" style="width:${value}%;--bc:${color}"></div></div>
  </div>`;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Risk gauge ───────────────────────────────────────
// r=55, circumference = 2π×55 ≈ 345.4
const GAUGE_C = 2 * Math.PI * 55;

function renderRisk(node, isManualSelection = false) {
  const confidence = Math.min(98, Math.round(72 + node.risk * 0.3));
  const sc   = riskColor(node.risk);
  const labelText  = node.risk >= 65 ? 'Elevated Risk' : node.risk >= 30 ? 'Under Watch' : 'Nominal';
  const labelClass = node.risk >= 65 ? 'tag-critical'  : node.risk >= 30 ? 'tag-watch'   : 'tag-healthy';

  // Badge & Reset Button
  const badge = $('#riskNodeBadge');
  if (badge) {
    badge.textContent = isManualSelection ? `Selected: ${node.id}` : 'Highest Risk';
    badge.style.color = isManualSelection ? 'var(--cyan)' : 'var(--amber)';
    badge.style.borderColor = isManualSelection ? 'var(--border-hi)' : 'var(--amber-glow)';
  }
  const resetBtn = $('#resetRiskButton');
  if (resetBtn) resetBtn.hidden = !isManualSelection;

  // Gauge
  const fill = $('#riskGaugeFill');
  if (fill) {
    const offset = GAUGE_C * (1 - node.risk / 100);
    fill.style.strokeDasharray  = GAUGE_C;
    fill.style.strokeDashoffset = offset;
    fill.style.stroke = sc;
  }

  setText('#riskValue', node.risk);
  setText('#riskNode',  node.id);

  const lbl = $('#riskLabel');
  if (lbl) { lbl.textContent = labelText; lbl.className = `status-tag ${labelClass}`; }

  setText('#confidenceValue', `${confidence}%`);
  setStyle('#confidenceBar', 'width', `${confidence}%`);
  setText('#riskExplanation', node.risk >= 65
    ? `Temperature and memory pressure are moving outside ${node.id}'s learned baseline.`
    : `Current signals remain within ${node.id}'s learned operating baseline.`);

  // Signals
  const signals = [
    ['GPU temperature', node.temp, 'var(--red)'],
    ['Memory pressure', node.ram,  'var(--amber)'],
    ['GPU utilization', node.gpu || 0, 'var(--cyan)'],
    ['CPU utilization', node.cpu,  'var(--violet)']
  ];

  const sl = $('#signalList');
  if (sl) {
    sl.innerHTML = signals.map(([name, val, color]) => {
      const unit = name.includes('temperature') ? '°C' : '%';
      return `<div class="signal-row" style="--sc:${color}">
        <span>${name}</span>
        <div class="sig-bar"><div class="sig-fill" style="width:${val}%;background:${color}"></div></div>
        <b class="sig-val">${val}${unit}</b>
      </div>`;
    }).join('');
  }
}

// ── Activity list ────────────────────────────────────
function renderActivity() {
  const COLOR = { alert:'var(--red)', brain:'var(--violet)', move:'var(--cyan)', shield:'var(--green)' };
  const al = $('#activityList');
  if (!al) return;
  al.innerHTML = state.activity.slice(0, 6).map(item => `
    <div class="act-row">
      <div class="act-icon" style="--ic:${COLOR[item.type]}">${ICON[item.type] || ICON.shield}</div>
      <div>
        <p class="act-title">${esc(item.title)}</p>
        <p class="act-detail">${esc(item.detail)}</p>
      </div>
      <time class="act-time">${esc(item.time)}</time>
    </div>`).join('');
}

// ── Incident panel ───────────────────────────────────
function updateIncident(incident) {
  const badge = $('#incidentStatus');
  if (badge) {
    badge.textContent = incident.status === 'resolved' ? 'Resolved' : 'Auto-healing';
    badge.style.color = incident.status === 'resolved' ? 'var(--green)' : 'var(--amber)';
    badge.style.background = incident.status === 'resolved' ? 'var(--green-dim)' : 'var(--amber-dim)';
  }

  // Drive checkpoint byte counter while in progress
  if (incident.status !== 'resolved') {
    const pct = incident.progress || 0;
    const gb  = (2.56 * pct / 100).toFixed(2);
    setText('#checkpointProgress', `${pct}%`);
    const bar = $('#ckptProgressBar');
    if (bar) bar.style.width = `${pct}%`;
    setText('#ckptBytes', `${gb} GB`);
    // Overall progress: phases 0+1 done = 33%, phase 2 in progress
    const overall = Math.round(33 + (pct / 100) * 17);
    setHealOverall(overall);
  }

  if (incident.status === 'resolved') {
    // Mark all 6 phases done
    $$('#healingTimeline .heal-li').forEach(li => {
      li.className = 'heal-li done';
      const icon = li.querySelector('i');
      if (icon) icon.innerHTML = ICON.check;
    });
    setText('#ckptTime',    'Done');
    setText('#migrateTime', 'Done');
    setText('#verifyTime',  'Verified');
    setText('#auditTime',   'Logged');
    setText('#checkpointProgress', '100%');
    const bar = $('#ckptProgressBar');
    if (bar) bar.style.width = '100%';
    setText('#ckptBytes', '2.56 GB');
    setHealOverall(100);
    setText('#incidentTitle',    '✓ Failure prevented — workload fully restored');
    setText('#incidentSubtitle', `${incident.node} · zero data loss · recovered in ${state.impact.recovery} seconds · $1,180 saved`);
    setText('#resolveButton',    '📄 View incident report');
  }
}

function setHealOverall(pct) {
  const fill = $('#healOverallFill');
  if (fill) fill.style.width = `${pct}%`;
  setText('#healOverallPct', `${pct}%`);
}

function appendHealLog(msg, cls = 'log-info') {
  const log = $('#healLog');
  if (!log) return;
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const line = document.createElement('span');
  line.className = `log-line ${cls}`;
  line.innerHTML = `[${t}] ${msg}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

async function completeHealing() {
  const btn = $('#resolveButton');
  if (state.incident?.status === 'resolved') return exportReport();
  if (!btn) return;
  btn.disabled = true;

  // ── Phase order: indices 0&1 already done, drive 2→5 ──────────────
  const phases = $$('#healingTimeline .heal-li');

  // ── Phase 2: Checkpoint animation (68% → 100%) ────────────────────
  btn.textContent = '③ Checkpointing workload…';
  setHealOverall(33);
  let ckptPct = 68;
  appendHealLog('Resuming checkpoint: train-resnet-42 @ 68%', 'log-cyan');
  while (ckptPct < 100) {
    ckptPct = Math.min(100, ckptPct + Math.floor(Math.random() * 7) + 4);
    const gb = (2.56 * ckptPct / 100).toFixed(2);
    setText('#checkpointProgress', `${ckptPct}%`);
    setText('#ckptBytes', `${gb} GB`);
    const bar = $('#ckptProgressBar');
    if (bar) bar.style.width = `${ckptPct}%`;
    setHealOverall(Math.round(33 + (ckptPct / 100) * 17));
    if (ckptPct < 100) await wait(140);
  }
  appendHealLog('Checkpoint complete: 2.56 GB written. SHA-256: <b>a3f7c9…</b> ✓', 'log-info');
  appendHealLog('infer-llm-07 state serialized to /mnt/cluster-ckpt/llm-07-snap.pt', 'log-cyan');
  if (phases[2]) {
    phases[2].className = 'heal-li done';
    phases[2].querySelector('i').innerHTML = ICON.check;
    setText('#ckptTime', 'Done');
  }
  await wait(400);

  // ── Phase 3: Migration ────────────────────────────────────────────
  if (phases[3]) phases[3].className = 'heal-li active';
  btn.textContent = '④ Migrating to gpu-worker-01…';
  setHealOverall(55);
  appendHealLog('Scoring candidate nodes by VRAM, CPU, risk…', 'log-info');
  await wait(500);
  appendHealLog('Winner: <b>gpu-worker-01</b> — risk 18%, VRAM free 9.2 GB, CPU 61%', 'log-info');
  await wait(400);
  appendHealLog('Transferring checkpoint 2.56 GB via internal fabric @ 3.1 GB/s…', 'log-cyan');
  await wait(700);
  appendHealLog('SHA-256 verified on gpu-worker-01. Replaying train-resnet-42 from epoch 47, batch 1204…', 'log-info');
  await wait(500);
  if (phases[3]) {
    phases[3].className = 'heal-li done';
    phases[3].querySelector('i').innerHTML = ICON.check;
    setText('#migrateTime', 'Done');
  }
  setHealOverall(72);
  await wait(300);

  // ── Phase 4: Verification ─────────────────────────────────────────
  if (phases[4]) phases[4].className = 'heal-li active';
  btn.textContent = '⑤ Verifying recovery…';
  setHealOverall(80);
  appendHealLog('Running warm-up forward pass on gpu-worker-01…', 'log-cyan');
  await wait(600);
  appendHealLog('Output tensor L2 distance vs reference: <b>0.0003</b> (ε = 0.001) ✓', 'log-info');
  await wait(400);
  appendHealLog('Health gate: CPU 61% ✓  RAM 58% ✓  Temp 67°C ✓  Disk lat 2ms ✓', 'log-info');
  await wait(300);
  appendHealLog('gpu-worker-01 marked <b>Ready</b>. Job running nominally.', 'log-info');
  if (phases[4]) {
    phases[4].className = 'heal-li done';
    phases[4].querySelector('i').innerHTML = ICON.check;
    setText('#verifyTime', 'Verified');
  }
  setHealOverall(90);
  await wait(300);

  // ── Phase 5: Audit ────────────────────────────────────────────────
  if (phases[5]) phases[5].className = 'heal-li active';
  btn.textContent = '⑥ Writing audit trail…';
  setHealOverall(95);
  appendHealLog('Writing incident record to audit DB…', 'log-info');
  await wait(500);
  appendHealLog('RCA: thermal runaway predicted 38 min early. Recovery: 24 s. Data loss: <b>0 bytes</b>.', 'log-info');
  await wait(300);
  appendHealLog('Billing: $1,180 avoided compute cost logged ✓', 'log-info');

  // ── API call ──────────────────────────────────────────────────────
  try {
    const res  = await fetch('api.php?action=heal', { method: 'POST' });
    const data = await res.json();
    state = { ...state, ...data };
  } catch {
    if (state.incident) { state.incident.status = 'resolved'; state.incident.progress = 100; }
    state.impact.prevented += 1;
    state.impact.savings   += 1180;
    state.activity.unshift({ type:'shield', title:'Failure prevented — 6-phase auto-heal', detail:'train-resnet-42 restored · zero data loss · 24 s recovery', time:'Now' });
  }

  if (phases[5]) {
    phases[5].className = 'heal-li done';
    phases[5].querySelector('i').innerHTML = ICON.check;
    setText('#auditTime', 'Logged');
  }
  setHealOverall(100);
  appendHealLog('<b>✓ Auto-healing complete.</b> 6 phases · 24 s · 0 bytes lost · $1,180 saved.', 'log-green');

  render();
  btn.disabled = false;
  playSuccessChime();
  toast('Auto-healing complete ✓', 'Zero data loss · 24 s recovery · $1,180 saved', 'var(--green)');
}

// ── Web Audio Synthesizer (Zero External Dependencies) ─────────
function playTone(freq, type = 'sine', duration = 0.15) {
  if (!state.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playSuccessChime() {
  if (!state.sound) return;
  playTone(523.25, 'sine', 0.12);
  setTimeout(() => playTone(659.25, 'sine', 0.12), 100);
  setTimeout(() => playTone(783.99, 'sine', 0.25), 200);
}

function playAlertBeep() {
  if (!state.sound) return;
  playTone(440, 'sawtooth', 0.15);
  setTimeout(() => playTone(349.23, 'sawtooth', 0.20), 120);
}

// ── Interactive Failure Scenario Injector ───────────
function injectScenario(scenario) {
  let targetNode = null;
  if (selectedRiskNodeId) {
    targetNode = state.nodes.find(n => n.id === selectedRiskNodeId);
  }
  if (!targetNode) {
    targetNode = [...state.nodes].sort((a,b) => b.risk - a.risk)[0] || state.nodes[0];
  }
  if (!targetNode) return;

  if (scenario === 'thermal') {
    targetNode.temp = 86;
    targetNode.cpu  = 88;
    targetNode.ram  = 84;
    targetNode.gpu  = 28;
    targetNode.risk = 79;
    targetNode.status = 'critical';
    state.incident = { node: targetNode.id, risk: 79, status: 'checkpointing', progress: 68 };
    playAlertBeep();
    toast(`🔥 Injected Thermal Spike into ${targetNode.id}`, 'GPU Temp 86°C · Anomaly risk score rose to 79%', 'var(--red)');
    appendHealLog(`[INJECTION] Thermal runaway scenario triggered on <b>${targetNode.id}</b>`, 'log-warn');
  } else if (scenario === 'memory') {
    targetNode.temp = 74;
    targetNode.cpu  = 82;
    targetNode.ram  = 96;
    targetNode.gpu  = 41;
    targetNode.risk = 85;
    targetNode.status = 'critical';
    state.incident = { node: targetNode.id, risk: 85, status: 'checkpointing', progress: 68 };
    playAlertBeep();
    toast(`💧 Injected RAM Memory Leak into ${targetNode.id}`, 'RAM pressure 96% · Anomaly risk score rose to 85%', 'var(--amber)');
    appendHealLog(`[INJECTION] Memory leak scenario triggered on <b>${targetNode.id}</b>`, 'log-warn');
  } else if (scenario === 'network') {
    targetNode.temp = 68;
    targetNode.cpu  = 81;
    targetNode.ram  = 72;
    targetNode.gpu  = 55;
    targetNode.risk = 71;
    targetNode.status = 'watch';
    state.incident = { node: targetNode.id, risk: 71, status: 'checkpointing', progress: 68 };
    playAlertBeep();
    toast(`⚡ Injected Network Jitter into ${targetNode.id}`, 'Packet jitter 120ms · Anomaly risk score rose to 71%', 'var(--cyan)');
    appendHealLog(`[INJECTION] Network jitter scenario triggered on <b>${targetNode.id}</b>`, 'log-cyan');
  } else if (scenario === 'reset') {
    targetNode.temp = 62;
    targetNode.cpu  = 54;
    targetNode.ram  = 52;
    targetNode.gpu  = 74;
    targetNode.risk = 14;
    targetNode.status = 'healthy';
    playSuccessChime();
    toast(`🟢 Normalized ${targetNode.id}`, 'Telemetry baseline restored to nominal operating levels', 'var(--green)');
    appendHealLog(`[INJECTION] Telemetry normalized on <b>${targetNode.id}</b>`, 'log-green');
  }

  render();
}

// ── Demo modal ───────────────────────────────────────
function startDemo() {
  state.demoStep = 0;
  showModal('#demoModal');
  renderDemoStep();
}

const DEMO_STEPS = [
  { text: 'IsolationForest evaluates 6 live signals — CPU 82%, RAM 89%, Temp 81°C, GPU utilization drop, network jitter, and disk latency — and produces a composite anomaly score of -0.312, crossing the -0.28 trigger threshold. Risk reaches 72%. Auto-heal policy HP-07 fires 38 minutes before projected failure.', btn: '② Isolate & checkpoint' },
  { text: 'gpu-worker-02 is immediately tainted NoSchedule to block new jobs. ClusterMind freezes both active jobs at a clean epoch boundary, then streams 2.56 GB of model weights, optimizer state, and epoch cursors to shared NFS storage. SHA-256 hash is computed for tamper-proof transfer verification.', btn: '③ Migrate workload' },
  { text: 'The scheduler scores every healthy node by VRAM headroom, CPU load, and risk score. gpu-worker-01 wins: risk 18%, 9.2 GB VRAM free. The verified checkpoint is transferred at 3.1 GB/s and replayed from exactly epoch 47, batch 1,204 — zero compute wasted.', btn: '④ Verify & audit' },
  { text: 'A warm-up forward pass confirms the L2 output distance is 0.0003 (well below ε = 0.001). All health gates pass. The full 6-phase incident is recorded in the audit trail: 24-second recovery, zero bytes lost, $1,180 in avoided downtime cost saved.', btn: 'Finish demo' }
];

function renderDemoStep() {
  const s = DEMO_STEPS[state.demoStep];
  setText('#demoNarration', s.text);
  setText('#demoNext',      s.btn);
  setText('#demoTimer',     `Step ${state.demoStep + 1} of 4`);
  setStyle('#demoProgress', 'width', `${(state.demoStep + 1) * 25}%`);

  $$('.demo-steps-row span').forEach((el, i) => el.classList.toggle('active', i <= state.demoStep));

  const dv = $('#demoVisual');
  if (!dv) return;
  if (state.demoStep <= 1) {
    dv.innerHTML = `<div class="demo-node-chip healthy">01</div><span class="demo-arrow">→</span><div class="demo-node-chip critical">02</div><span class="demo-arrow">→</span><div class="demo-node-chip healthy">03</div>`;
  } else if (state.demoStep === 2) {
    dv.innerHTML = `<div class="demo-node-chip healthy">02</div><span class="demo-arrow">checkpoint →</span><div class="demo-node-chip healthy">01</div>`;
  } else {
    dv.innerHTML = `<div class="demo-node-chip healthy" style="font-size:1.25rem">✓</div><span class="demo-arrow">24 sec · zero loss · $1,180 saved</span>`;
  }
}

function nextDemoStep() {
  if (state.demoStep < 3) {
    state.demoStep++;
    renderDemoStep();
  } else {
    hideModal('#demoModal');
    completeHealing();
  }
}

// ── Report export ────────────────────────────────────
function exportReport() {
  const highest = [...state.nodes].sort((a,b) => b.risk - a.risk)[0] || state.nodes[0];
  const report  = [
    'CLUSTERMIND INCIDENT REPORT',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Node: ${state.incident?.node || highest?.id || 'unknown'}`,
    `Peak risk: ${state.incident?.risk || highest?.risk || 0}%`,
    'Detection: Multi-signal IsolationForest anomaly',
    'Action: Checkpoint → isolate → migrate → verify',
    `Recovery time: ${state.impact.recovery} seconds`,
    'Data loss: Zero',
    'Estimated cost avoided: $1,180',
    '',
    'Audit status: Integrity verified'
  ].join('\n');

  const url  = URL.createObjectURL(new Blob([report], { type: 'text/plain' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `clustermind-incident-${Date.now()}.txt` });
  link.click();
  URL.revokeObjectURL(url);
  toast('Report exported', 'Judge-ready incident evidence downloaded', 'var(--cyan)');
}

// ── Toast notifications ──────────────────────────────
function toast(title, detail, color = 'var(--cyan)') {
  const region = $('#toastRegion');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.setProperty('--tc', color);
  el.innerHTML = `<strong>${esc(title)}</strong><small>${esc(detail)}</small>`;
  region.append(el);
  setTimeout(() => el.remove(), 4500);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Telemetry simulation ──────────────────────────────
function simulateTelemetry() {
  state.tick++;
  state.nodes = state.nodes.map((node, i) => {
    if (node.source === 'real') return node;
    const wave  = Math.sin((state.tick + i) * 0.65);
    const drift = (node.id === 'gpu-worker-02' && state.incident?.status !== 'resolved') ? 1 : 0;
    return {
      ...node,
      cpu:  clamp(Math.round(node.cpu  + wave * 2), 12, 96),
      gpu:  node.gpu ? clamp(Math.round(node.gpu + Math.cos(state.tick + i) * 2), 8, 96) : 0,
      temp: clamp(Math.round(node.temp + wave + drift), 38, 91),
      risk: (node.id === 'gpu-worker-02' && state.incident?.status !== 'resolved')
        ? clamp(node.risk + (state.tick % 2 ? 0 : 1), 0, 88)
        : node.risk
    };
  });
  render();
}

// ── Refresh real nodes from API ───────────────────────
async function refreshRealNodes() {
  try {
    const res  = await fetch('api.php?action=status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const real    = (data.nodes || []).filter(n => n.source === 'real');
    const realIds = new Set(real.map(n => n.id));
    state.nodes = state.nodes.filter(n => n.source !== 'real' || realIds.has(n.id));
    real.forEach(remote => {
      const idx = state.nodes.findIndex(n => n.id === remote.id);
      if (idx >= 0) state.nodes[idx] = remote;
      else state.nodes.push(remote);
    });
    render();
  } catch { /* keep last state */ }
}

// ── Node Details ──────────────────────────────────────
function openNodeDetails(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return;
  selectedNodeId = node.id;

  const statusLabel = { critical:'Critical risk', watch:'Under watch', pending:'Awaiting telemetry', healthy:'Healthy' }[node.status] || 'Healthy';
  const statusColor = { critical:'var(--red)', watch:'var(--amber)', pending:'var(--violet)', healthy:'var(--green)' }[node.status] || 'var(--green)';

  setText('#nodeDetailsTitle', node.id);
  setText('#nodeDetailsType',  node.type || '');

  const hTag = $('#nodeDetailsHealth');
  if (hTag) { hTag.textContent = statusLabel; hTag.style.cssText = `color:${statusColor};background:color-mix(in srgb,${statusColor} 14%,transparent);border:1px solid color-mix(in srgb,${statusColor} 30%,transparent);padding:3px 12px;border-radius:12px;font-size:.75rem;font-weight:700`; }

  // Metrics row
  const mr = $('#nodeDetailsMetrics');
  if (mr) {
    mr.innerHTML = [
      ['CPU',    `${node.cpu}%`],
      ['GPU',    node.gpu ? `${node.gpu}%` : 'N/A'],
      ['RAM',    `${node.ram}%`],
      ['Temp',   `${node.temp}°C`],
      ['AI risk',`${node.risk}%`]
    ].map(([label, value]) => `
      <div class="metric-mini">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>`).join('');
  }

  const source = node.source || 'built-in';
  const connKV = $('#nodeConnectionDetails');
  if (connKV) {
    connKV.innerHTML = [
      ['Hardware Specs', node.type || 'Standard Hardware'],
      ['Source',          source],
      ['Connection',      source === 'real' ? (node.connection || 'waiting') : 'online'],
      ['Active jobs',     node.jobs],
      ['Last seen',       node.lastSeen ? new Date(node.lastSeen).toLocaleString() : (source === 'real' ? 'Waiting for first packet' : 'Live now')],
      ['Interval',        '5 seconds']
    ].map(([k,v]) => `<div class="kv-pair"><span>${k}</span><b>${esc(String(v))}</b></div>`).join('');
  }

  const savedTokens = JSON.parse(sessionStorage.getItem('clustermind-agent-tokens') || '{}');
  const token    = savedTokens[node.id] || '[NODE_TOKEN]';
  const endpoint = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}api.php?action=ingest`;
  setText('#nodeDetailsCommand', `curl -X POST "${endpoint}" -H "Content-Type: application/json" -d "{\\"token\\":\\"${token}\\",\\"id\\":\\"${node.id}\\",\\"cpu\\":42,\\"gpu\\":78,\\"ram\\":61,\\"temp\\":67}"`);

  // Render assigned workloads for this node
  const assigned = WORKLOAD_JOBS.filter(j => j.node === node.id);
  const njContainer = $('#nodeAssignedJobs');
  if (njContainer) {
    if (assigned.length) {
      njContainer.innerHTML = assigned.map(j => `
        <div class="node-job-row">
          <div class="nj-info">
            <strong class="nj-id">${esc(j.id)}</strong>
            <span class="nj-name">${esc(j.name)}</span>
          </div>
          <span class="nj-badge">${esc(j.category)}</span>
          <span class="nj-prog">${esc(j.progress)}</span>
          <span class="nj-status ${j.status==='Migrating'?'warn':''}">${esc(j.status)}</span>
        </div>
      `).join('');
    } else {
      njContainer.innerHTML = `<p class="nj-empty">No active workloads currently assigned to this node.</p>`;
    }
  }

  const deletable = Boolean(node.source);
  const dz = $('#nodeDangerZone');
  const pn = $('#protectedNodeNote');
  if (dz) dz.hidden = !deletable;
  if (pn) pn.hidden = deletable;
  setText('#deleteConfirmName', node.id);
  const dci = $('#deleteNodeConfirmation');
  if (dci) dci.value = '';
  const dbn = $('#deleteNodeButton');
  if (dbn) dbn.disabled = true;
  setText('#deleteNodeError', '');

  showModal('#nodeDetailsModal');
}

async function deleteSelectedNode() {
  const node = state.nodes.find(n => n.id === selectedNodeId);
  if (!node || !node.source) return;
  const confirmation = ($('#deleteNodeConfirmation')?.value || '').trim();
  if (confirmation !== node.id) {
    setText('#deleteNodeError', 'The confirmation name does not match.');
    return;
  }
  const btn = $('#deleteNodeButton');
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }

  try {
    if (node.source === 'real') {
      const res  = await fetch('api.php?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.body.dataset.csrfToken },
        body: JSON.stringify({ id: node.id, confirmation })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      const tokens = JSON.parse(sessionStorage.getItem('clustermind-agent-tokens') || '{}');
      delete tokens[node.id];
      sessionStorage.setItem('clustermind-agent-tokens', JSON.stringify(tokens));
    } else {
      const demos = JSON.parse(localStorage.getItem('clustermind-demo-nodes') || '[]').filter(n => n.id !== node.id);
      localStorage.setItem('clustermind-demo-nodes', JSON.stringify(demos));
    }
    state.nodes = state.nodes.filter(n => n.id !== node.id);
    hideModal('#nodeDetailsModal');
    render();
    toast('Node deleted', `${node.id} removed${node.source === 'real' ? ' and token revoked' : ''}`, 'var(--red)');
  } catch (err) {
    setText('#deleteNodeError', err.message);
    if (btn) btn.disabled = false;
  } finally {
    if (btn) btn.textContent = 'Delete node permanently';
  }
}

// ── Node connect modal ────────────────────────────────
function randomToken() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2,'0')).join('');
}

// ── Modal Helpers ─────────────────────────────────────
function showModal(modalEl) {
  if (typeof modalEl === 'string') modalEl = $(modalEl);
  if (!modalEl) return;
  modalEl.hidden = false;
  modalEl.removeAttribute('hidden');
}

function hideModal(modalEl) {
  if (typeof modalEl === 'string') modalEl = $(modalEl);
  if (!modalEl) return;
  modalEl.hidden = true;
  modalEl.setAttribute('hidden', '');
}

function openNodeModal() {
  $('#nodeForm')?.reset();
  setText('#nodeFormError', '');
  const at = $('#agentToken');
  if (at) at.value = randomToken();

  // Pre-fill a smart default node name so clicking submit works instantly
  const existingNames = new Set(state.nodes.map(n => n.id.toLowerCase()));
  let count = state.nodes.length + 1;
  let defaultName = `gpu-worker-0${count}`;
  while (existingNames.has(defaultName.toLowerCase())) {
    count++;
    defaultName = `gpu-worker-${count < 10 ? '0' + count : count}`;
  }
  const nameInput = $('#newNodeName');
  if (nameInput) nameInput.value = defaultName;

  showModal('#nodeModal');
  setConnectMode('real');
  updateAgentCommand();
  setTimeout(() => $('#newNodeName')?.select(), 50);
}

function setConnectMode(mode) {
  connectMode = mode;
  $$('[data-connect-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.connectMode === mode);
    btn.setAttribute('aria-selected', String(btn.dataset.connectMode === mode));
  });
  const rf = $('#realNodeFields');
  const df = $('#demoNodeFields');
  const sb = $('#connectNodeSubmit');
  if (rf) rf.hidden = mode !== 'real';
  if (df) df.hidden = mode !== 'demo';
  if (sb) {
    sb.innerHTML = mode === 'real'
      ? '<span>Register &amp; Connect Node</span><svg viewBox="0 0 24 24" class="btn-icon-right" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>'
      : '<span>Add Demo Node</span><svg viewBox="0 0 24 24" class="btn-icon-right" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>';
  }
}

function setCommandPlatform(platform) {
  $$('[data-command-platform]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.commandPlatform === platform);
    btn.setAttribute('aria-selected', String(btn.dataset.commandPlatform === platform));
  });
  $$('[data-platform-command]').forEach(panel => {
    panel.hidden = panel.dataset.platformCommand !== platform;
  });
}

function updateAgentCommand() {
  const name     = ($('#newNodeName')?.value || '').trim() || 'gpu-worker-04';
  const token    = $('#agentToken')?.value || '';
  const endpoint = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}api.php?action=ingest`;
  setText('#agentCommand', `curl -X POST '${endpoint}' -H 'Content-Type: application/json' -d '{"token":"${token}","id":"${name}","cpu":42,"gpu":78,"ram":61,"temp":67}'`);
  updateLanCommand();
}

function updateLanCommand() {
  const name     = ($('#newNodeName')?.value || '').trim() || 'gpu-worker-04';
  const token    = $('#agentToken')?.value || '';
  const ip       = ($('#lanIpAddress')?.value || '').trim();
  const port     = ($('#lanPort')?.value || '').trim() || '8080';
  const basePath = location.pathname.replace(/[^/]*$/, '');
  const host     = ip || 'YOUR-LAN-IP';
  const url      = `http://${host}:${port}${basePath}api.php?action=ingest`;
  const agentUrl = `http://${host}:${port}${basePath}agents/windows-agent.ps1`;
  const instUrl  = `http://${host}:${port}${basePath}agents/install-windows-agent.ps1`;
  const payload  = `{"token":"${token}","id":"${name}","cpu":42,"gpu":78,"ram":61,"temp":67}`;

  setText('#lanAgentCommand',          `curl -X POST '${url}' -H 'Content-Type: application/json' -d '${payload}'`);
  setText('#windowsLanAgentCommand',   `powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path $env:TEMP 'install-clustermind.ps1'; Invoke-WebRequest '${instUrl}' -OutFile $p; & $p -Endpoint '${url}' -AgentUrl '${agentUrl}' -Token '${token}' -NodeId '${name}'"`);
  setText('#lanHint', ip
    ? `Detected ${ip}. Both devices must be on the same Wi-Fi/LAN, and port ${port} must be reachable.`
    : `LAN IP not detected. Enter the host's Wi-Fi IPv4 address, e.g. 192.168.1.100.`);
}

function nodeTypeLabel(type) {
  return ({ 'NVIDIA GPU worker':'NVIDIA GPU · Real agent', 'AMD GPU worker':'AMD GPU · Real agent', 'CPU worker':'CPU · Real agent', 'Apple Silicon worker':'Apple Silicon · Real agent', 'Control plane':'Control plane' })[type] || type;
}

async function addNode(event) {
  if (event) event.preventDefault();
  let name = ($('#newNodeName')?.value || '').trim();
  if (!name) {
    name = `gpu-worker-0${state.nodes.length + 1}`;
  }
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(name)) {
    setText('#nodeFormError', 'Use 3–40 letters, numbers, periods, underscores, or hyphens.');
    return;
  }
  if (state.nodes.some(n => n.id.toLowerCase() === name.toLowerCase())) {
    setText('#nodeFormError', 'A node with this name is already connected.');
    return;
  }
  const type = $('#newNodeType')?.value || '';

  if (connectMode === 'demo') {
    const condition = $('#demoCondition')?.value || 'healthy';
    const profiles  = {
      healthy:  { cpu:42, gpu:63, ram:48, temp:58, risk:11, status:'healthy'  },
      watch:    { cpu:72, gpu:84, ram:76, temp:72, risk:38, status:'watch'    },
      critical: { cpu:91, gpu:36, ram:92, temp:86, risk:79, status:'critical' }
    };
    const node = { id:name, type: nodeTypeLabel(type).replace('Real agent','Demo device'), ...profiles[condition], jobs:2, source:'demo' };
    state.nodes.push(node);
    const demos = JSON.parse(localStorage.getItem('clustermind-demo-nodes') || '[]');
    demos.push(node);
    localStorage.setItem('clustermind-demo-nodes', JSON.stringify(demos));
    hideModal('#nodeModal');
    render();
    toast('Demo node connected', `${name} is now streaming simulated telemetry`, 'var(--cyan)');
    return;
  }

  try {
    const res  = await fetch('api.php?action=register', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ id: name, type: nodeTypeLabel(type), token: $('#agentToken')?.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    state.nodes.push(data.node);
    const tokens = JSON.parse(sessionStorage.getItem('clustermind-agent-tokens') || '{}');
    tokens[name] = $('#agentToken')?.value;
    sessionStorage.setItem('clustermind-agent-tokens', JSON.stringify(tokens));
    hideModal('#nodeModal');
    render();
    toast('Real node registered', `${name} is waiting for its first telemetry packet`, 'var(--violet)');
  } catch (err) {
    setText('#nodeFormError', err.message);
  }
}

// ── Theme toggle ──────────────────────────────────────
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-mode');
  localStorage.setItem('clustermind-theme', body.classList.contains('light-mode') ? 'light' : 'dark');
  const btn = $('#themeToggle');
  if (btn) btn.classList.toggle('active', body.classList.contains('light-mode'));
}

// Restore saved theme immediately (before paint)
(function initTheme() {
  const saved = localStorage.getItem('clustermind-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.classList.add('active');
  }
})();

// ── Sidebar toggle ────────────────────────────────────
function toggleSidebar() {
  const mini = document.body.classList.toggle('sidebar-mini');
  localStorage.setItem('clustermind-sidebar', mini ? 'mini' : 'full');
  const btn = $('#sidebarToggle');
  if (btn) {
    btn.setAttribute('aria-expanded', String(!mini));
    btn.title = mini ? 'Expand sidebar' : 'Collapse sidebar';
  }
  // Swap icon: hamburger ↔ grid/panel icon
  const icon = $('#sidebarToggleIcon');
  if (icon) {
    icon.innerHTML = mini
      ? '<rect x="3" y="3" width="7" height="18" rx="1"/><path d="M14 3h7M14 9h7M14 15h7M14 21h7"/>'
      : '<path d="M3 6h18M3 12h18M3 18h18"/>';
  }
}

// Restore saved sidebar state immediately (before paint)
(function initSidebar() {
  if (localStorage.getItem('clustermind-sidebar') === 'mini') {
    document.body.classList.add('sidebar-mini');
    const btn = document.getElementById('sidebarToggle');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.title = 'Expand sidebar';
    }
    const icon = document.getElementById('sidebarToggleIcon');
    if (icon) icon.innerHTML = '<rect x="3" y="3" width="7" height="18" rx="1"/><path d="M14 3h7M14 9h7M14 15h7M14 21h7"/>';
  }
})();

// ── Event wiring ──────────────────────────────────────
// All handlers use direct, synchronous responses — no debounce overhead
function wireEvents() {
  // Search — input event fires immediately
  $('#nodeSearchInput')?.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    renderNodes();
  });

  // Filter pills — event delegation for zero-latency response
  $$('[data-status-filter]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-status-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.statusFilter = btn.dataset.statusFilter;
    renderNodes();
  }));

  // Nav items — scroll into view
  $$('.nav-item[data-view]').forEach(btn => btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const map = { overview:'.hero', nodes:'.node-panel', incidents:'.incident-panel', jobs:'#jobsPanel', impact:'.impact-panel' };
    $(map[btn.dataset.view])?.scrollIntoView({ behavior:'smooth', block:'start' });
  }));

  // Job category filter pills
  $$('[data-job-filter]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-job-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.jobFilter = btn.dataset.jobFilter;
    renderJobs();
  }));

  // Node grid — event delegation
  $('#nodeGrid')?.addEventListener('click', e => {
    const detailsBtn = e.target.closest('[data-node-details]');
    if (detailsBtn) {
      openNodeDetails(detailsBtn.dataset.nodeDetails);
      return;
    }
    const card = e.target.closest('[data-node-card-id]');
    if (card) {
      selectedRiskNodeId = card.dataset.nodeCardId;
      render();
    }
  });

  // Reset risk selection to highest risk node
  $('#resetRiskButton')?.addEventListener('click', () => {
    selectedRiskNodeId = null;
    render();
  });

  // Failure Scenario Injector buttons
  $$('[data-inject-scenario]').forEach(btn => {
    btn.addEventListener('click', () => injectScenario(btn.dataset.injectScenario));
  });

  // Main action buttons
  $('#topologyButton')?.addEventListener('click', () => showModal('#topologyModal'));
  $('#resolveButton')?.addEventListener('click',  completeHealing);
  $('#runDemoButton')?.addEventListener('click',  startDemo);
  $('#demoNav')?.addEventListener('click',        startDemo);
  $('#demoNext')?.addEventListener('click',       nextDemoStep);
  $('#explainButton')?.addEventListener('click',  () => showModal('#explainModal'));
  $('#exportButton')?.addEventListener('click',   exportReport);
  $('#addNodeButton')?.addEventListener('click',        openNodeModal);
  $('#connectNodeHeroButton')?.addEventListener('click', openNodeModal);
  $('#sidebarToggle')?.addEventListener('click',       toggleSidebar);
  $('#themeToggle')?.addEventListener('click',        toggleTheme);

  // Judge Presentation Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const key = e.key.toLowerCase();
    if (key === 'd') startDemo();
    else if (key === 'h') completeHealing();
    else if (key === 'e') showModal('#explainModal');
    else if (key === 'p') showModal('#topologyModal');
    else if (key === 't') toggleTheme();
    else if (key === '1') injectScenario('thermal');
    else if (key === '2') injectScenario('memory');
    else if (key === '3') injectScenario('network');
    else if (key === '4') injectScenario('reset');
  });

  // Sound toggle
  $('#soundButton')?.addEventListener('click', e => {
    state.sound = !state.sound;
    e.currentTarget.classList.toggle('active', state.sound);
    e.currentTarget.setAttribute('aria-pressed', String(state.sound));
    toast(`Alert sounds ${state.sound ? 'enabled' : 'muted'}`, 'Critical events will be surfaced visually' + (state.sound ? ' and audibly.' : '.'), 'var(--violet)');
  });

  // Node form
  $('#nodeForm')?.addEventListener('submit',          addNode);
  $('#connectNodeSubmit')?.addEventListener('click', addNode);
  $('#newNodeName')?.addEventListener('input',    updateAgentCommand);
  $('#lanIpAddress')?.addEventListener('input',   updateLanCommand);
  $('#lanPort')?.addEventListener('input',        updateLanCommand);

  $$('[data-connect-mode]').forEach(btn => btn.addEventListener('click', () => setConnectMode(btn.dataset.connectMode)));
  $$('[data-command-platform]').forEach(btn => btn.addEventListener('click', () => setCommandPlatform(btn.dataset.commandPlatform)));

  // Copy buttons (async clipboard)
  const copyPairs = [
    ['#copyTokenButton',              () => $('#agentToken')?.value,                            'Token copied',         'Paste it only on the target device'],
    ['#copyCommandButton',            () => $('#agentCommand')?.textContent,                    'Setup command copied', 'Run it on the real node'],
    ['#copyLanCommandButton',         () => $('#lanAgentCommand')?.textContent,                 'LAN command copied',   'Run it on another network device'],
    ['#copyWindowsLanCommandButton',  () => $('#windowsLanAgentCommand')?.textContent,          'Windows command copied','Paste into Command Prompt on the target node'],
    ['#copyNodeDetailsCommand',       () => $('#nodeDetailsCommand')?.textContent,              'Node command copied',  'Use saved node token if command shows [NODE_TOKEN]']
  ];
  copyPairs.forEach(([sel, getter, title, detail]) => {
    $(sel)?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(getter() || ''); toast(title, detail, 'var(--cyan)'); }
      catch { toast('Copy failed', 'Please copy the text manually', 'var(--amber)'); }
    });
  });

  // Delete node flow
  $('#deleteNodeConfirmation')?.addEventListener('input', e => {
    const dbn = $('#deleteNodeButton');
    if (dbn) dbn.disabled = e.target.value.trim() !== selectedNodeId;
    setText('#deleteNodeError', '');
  });
  $('#deleteNodeButton')?.addEventListener('click', deleteSelectedNode);

  // Modal close — backdrop click, button, Escape
  $$('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => hideModal(btn.closest('.modal-backdrop'))));
  $$('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', e => { if (e.target === backdrop) hideModal(backdrop); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal-backdrop:not([hidden])').forEach(m => hideModal(m)); });

  // Range toggle
  $$('[data-range]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    toast(`${btn.textContent} impact window`, 'Chart range updated', 'var(--cyan)');
  }));
}

// ── Boot ──────────────────────────────────────────────
wireEvents();
loadState();
setInterval(simulateTelemetry, 5000);
setInterval(refreshRealNodes, 5000);
