# ClusterMind — AI-Powered Self-Healing Cluster Intelligence

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-IsolationForest-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

**Enterprise-grade AI cluster operations center for heterogeneous GPU/CPU worker fleets.**  
*Turns 17D hardware telemetry into actionable anomaly risk scores with zero-downtime workload migration.*

[📡 API Docs](#-rest-api-reference) • [🚀 Quick Start](#-quick-start) • [🔌 Connect Hardware](#-connecting-real-physical-hardware) • [🏗 Architecture](#-architecture)

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **6D IsolationForest AI** | Real-time anomaly evaluation across CPU %, GPU Util %, System RAM %, Thermal °C, Disk IOPS, and Net Jitter |
| **SHA-256 Checkpoint Verification** | Cryptographically asserts `source_checkpoint == target_checkpoint` — guarantees `0` lost training steps and `0.00s` data loss |
| **Safe Mode Quarantine (NoSchedule)** | Automatically quarantines anomalous nodes; blocks new workload assignments until health normalizes over 5 consecutive telemetry checks |
| **Zero-Downtime Workload Migration** | Autonomously re-routes running AI training/inference jobs to healthy nodes during anomaly events |
| **Real Hardware Agent Support** | Streams live telemetry from Windows (PowerShell), macOS, and Linux (Python) physical devices via lightweight agents |
| **Pure Real-Device Mode** | Clears all synthetic data so operators track only authentic physical hardware baselines (`real@clustermind.ai`) |
| **Dark & Light Mode** | Full theme support with OS-level `prefers-color-scheme` detection and persistent user preference |
| **Fully Responsive UI** | Adapts seamlessly from 360px phones to 1600px+ ultra-wide monitors across 9 breakpoints |
| **Explanatory Audit Trail** | Every action appends plain-English sentences with SHA-256 hashes, recovery times, and Safe Mode states |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      ClusterMind Platform                         │
├───────────────────────────┬──────────────────────────────────────┤
│  React 18 Frontend (Vite) │   FastAPI Backend (Python)           │
│  ─────────────────────    │   ───────────────────────────────    │
│  • Dashboard (live KPIs)  │   • IsolationForest AI Engine        │
│  • Node Inspector         │   • SHA-256 Checkpoint Engine        │
│  • Workload Monitor       │   • Safe Mode State Machine          │
│  • Activity Audit Log     │   • In-memory Node Registry          │
│  • ConnectNode Wizard     │   • Telemetry REST API (15 routes)   │
│  • Scenario Injector      │   • Real-hardware Agent Server       │
│  • Dark / Light Mode      │                                      │
└───────────────────────────┴──────────────────────────────────────┘
         ▲                                   ▲
         │ HTTP / JSON                       │ Telemetry Packets (3s)
         ▼                                   ▼
  Browser Client                    Physical Hardware Agents
                                    (agent.py / agent.ps1)
```

### AI Anomaly Engine — `backend/ml_model.py`

**Input vector (6D):**
```
x = [CPU%, RAM%, Disk_IOPS, Net_Jitter_ms, GPU_Temp°C, GPU_Util%]
```

**Model:** `sklearn.ensemble.IsolationForest` (n_estimators=100, contamination=0.1)

**Risk blending formula:**
```
PhysicalRisk = min(98, 25 + 0.40·CPU_stress + 0.30·Temp_stress + 0.20·GPU_stress + 0.10·RAM_stress)
```
Guarantees CPU ≥ 90% / Temp ≥ 75°C / GPU ≥ 85% always evaluates to **Critical Risk ≥ 75%**.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### 1. Start the FastAPI Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

> Backend runs on **`http://127.0.0.1:8000`**  
> Interactive Swagger UI at **`http://127.0.0.1:8000/docs`**

### 2. Start the React Frontend

```bash
# From project root
npm install
npm run dev
```

> Frontend runs on **`http://localhost:5173`**

### 3. Login Credentials

| Role | Email | Password | Description |
|---|---|---|---|
| Cluster Admin | `admin@clustermind.ai` | `cluster123` | Full telemetry, anomaly control & node deletion |
| Auditor | `auditor@clustermind.ai` | `cluster123` | Read-only telemetry & audit log access |
| Judge Demo | `judge@clustermind.ai` | `cluster123` | Guided walkthrough with scenario injector |
| Real Hardware | `real@clustermind.ai` | `cluster123` | Pure real-device mode — 0 synthetic data |

---

## 🔌 Connecting Real Physical Hardware

Navigate to **Connect Node → Real Device** on the dashboard to generate a private auth token and a ready-to-copy telemetry command.

### macOS / Linux — Python Agent

```bash
python3 backend/agent.py --node-id "my-machine" --server "http://<YOUR_LOCAL_IP>:8000"
```

### Windows — PowerShell Agent

```powershell
powershell -ExecutionPolicy Bypass -File backend/agent.ps1 `
  -NodeId "my-windows-pc" -ServerUrl "http://<YOUR_LOCAL_IP>:8000"
```

### Auto-download agent scripts

```bash
# Python agent
curl http://localhost:8000/api/agent/python -o agent.py

# PowerShell agent
curl http://localhost:8000/api/agent/ps1 -o agent.ps1
```

Agents stream telemetry every **3 seconds**. Heartbeat timeout is detected after **12 seconds** — node is automatically marked offline.

---

## 📡 REST API Reference

**Base URL:** `http://localhost:8000`  
**Full interactive docs:** [`/docs`](http://localhost:8000/docs) (Swagger UI) · [`/redoc`](http://localhost:8000/redoc) (ReDoc)  
**Complete reference:** [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)

### Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Full cluster state — nodes, workloads, incident, impact, activity |
| `POST` | `/api/ingest` | Agent telemetry ingestion — runs IsolationForest, updates node state |
| `POST` | `/api/heal` | Execute checkpoint migration with SHA-256 verification & Safe Mode |
| `POST` | `/api/predict` | Direct 6D IsolationForest model inference |
| `POST` | `/api/register` | Register a node and generate a private auth token |
| `POST` | `/api/node` | Add or update a node in the registry |
| `POST` | `/api/node/safemode` | Toggle Safe Mode quarantine on a specific node |
| `POST` | `/api/delete` | Delete a node and permanently revoke its token |
| `POST` | `/api/scenario` | Inject a simulated failure scenario (thermal / memory / network) |
| `POST` | `/api/config` | Update global IsolationForest risk sensitivity threshold |
| `POST` | `/api/reset` | Reset full backend state to initial baseline |
| `POST` | `/api/nodes/clear-all` | Clear all synthetic data for pure real-device mode |
| `POST` | `/api/activity/clear` | Clear the activity audit log |
| `GET` | `/api/agent/python` | Download the Python telemetry agent script |
| `GET` | `/api/agent/ps1` | Download the PowerShell telemetry agent script |

---

## 📂 Project Structure

```
innovation/
├── backend/
│   ├── main.py              # FastAPI server — all 15 API routes
│   ├── ml_model.py          # IsolationForest AI anomaly engine
│   ├── agent.py             # macOS/Linux Python telemetry agent
│   ├── agent.ps1            # Windows PowerShell telemetry agent
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── components/
│   │   ├── auth/            # LoginPage — dark/light mode, theme toggle
│   │   ├── layout/          # Topbar, Sidebar (responsive off-canvas drawer)
│   │   ├── dashboard/       # MetricsBar, HealingPanel, NodeGrid, WorkloadTable
│   │   └── modals/          # ConnectNode Wizard, Node Inspector
│   ├── context/
│   │   └── ClusterContext.jsx  # Global state + theme (OS prefers-color-scheme)
│   └── styles/
│       └── index.css        # Full design system — dark/light tokens, 9 breakpoints
├── docs/
│   ├── API_REFERENCE.md     # Complete endpoint reference with request/response schemas
│   ├── DESIGN_NOTE.md       # Technical system architecture & design note
│   ├── PRESENTATION_SLIDES.md
│   └── ClusterMind_Concept_Note.pdf
├── package.json
└── README.md
```

---

## 🖥 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `1600px+` | Ultra-wide: 4-column metrics, extra padding |
| `1440px` | Large laptop: gap compression |
| `1200px` | Laptop: 2-column dashboard grid |
| `1024px` | Tablet landscape: 1-column + mini sidebar |
| `900px` | Tablet portrait: 2-column metrics |
| `768px` | Mobile: sidebar off-canvas drawer |
| `600px` | Large phone: single-column node grid |
| `480px` | Phone: compact login card, 1-column metrics |
| `360px` | Tiny phone: minimum viable layout |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18.3 + Vite 6 |
| Styling | Vanilla CSS — CSS custom properties, 9 responsive breakpoints, glassmorphism |
| Icons | Lucide React |
| Backend | FastAPI 0.110+ + Uvicorn |
| AI / ML | scikit-learn IsolationForest + NumPy |
| Schema Validation | Pydantic v2 |
| Security | SHA-256 checkpoint hashing (`hashlib`), per-node `secrets.token_hex(16)` auth tokens |

---

## 📄 Documentation

| File | Description |
|---|---|
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Complete REST API endpoint reference with request/response schemas |
| [`docs/DESIGN_NOTE.md`](docs/DESIGN_NOTE.md) | Technical system architecture & design note |
| [`docs/PRESENTATION_SLIDES.md`](docs/PRESENTATION_SLIDES.md) | Hackathon pitch deck slides |
| [`docs/ClusterMind_Concept_Note.pdf`](docs/ClusterMind_Concept_Note.pdf) | Concept note PDF |

---

## 🏆 Hackathon

| Field | Value |
|---|---|
| **Team** | Runtime Terrors |
| **Track** | AI for Cluster Intelligence — Predictive Operations |
| **Event** | Daffodil International University — AI Innovation Hackathon 2026 (Final Round) |

---

<div align="center">
Built with ⚡ by <strong>Team Runtime Terrors</strong>
</div>
