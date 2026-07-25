# ClusterMind — AI-Powered Self-Healing Cluster Intelligence

[![FastAPI Backend](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React Frontend](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://react.dev/)
[![IsolationForest ML](https://img.shields.io/badge/scikit--learn-IsolationForest-F7931E.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ClusterMind** is an enterprise-grade AI cluster operations center designed for heterogeneous GPU/CPU worker clusters. It turns multi-signal 17D hardware telemetry into an explainable IsolationForest risk score, executes zero-downtime workload migrations, cryptographically verifies state checkpoints with SHA-256 signatures, and enforces Safe Mode quarantine protection.

---

## 🌟 Key Features & Architecture

- **6D IsolationForest AI Anomaly Engine:** Real-time kernel evaluation across `[CPU %, GPU Util %, System RAM %, Thermal °C, Disk IOPS, Net Jitter]`.
- **SHA-256 Cryptographic Checkpoint Verification:** Validates `source_checkpoint == target_checkpoint` upon failover, guaranteeing **0 lost steps** and **0.00s data loss** (`VERIFIED_EXACT`).
- **Safe Mode Protection (Quarantine / NoSchedule):** Automatically quarantines weak or healed nodes, blocking new workload assignments until health normalizes over 5 consecutive telemetry checks.
- **Migration Success Report Widget:** Displays real-time migration success rate (100%), dynamic average recovery time (`24.3s`), and false alarms filtered by IsolationForest.
- **Explanatory Audit Trail:** Appends full, plain-English explanatory sentences to audit entries detailing workloads, SHA-256 hashes, recovery times, and Safe Mode states.
- **Cross-Platform Physical Agents:** Stream live telemetry from Windows, macOS, and Linux hardware via `agent.py`, `agent.ps1`, and `windows-agent.ps1`.
- **Pure Real-Device Hardware Mode (`real@clustermind.ai`):** Clears synthetic data to track real physical hardware metrics starting from authentic baselines.

---

## 🚀 Quick Start & Local Execution

### 1. Start the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://127.0.0.1:8000`.*

### 2. Start the React Frontend
```bash
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 💻 Connecting Real Physical Hardware Devices

Navigate to **Connect Node → Real Device** on the dashboard to generate private tokens and ready-to-run telemetry commands:

### Windows PowerShell Agent
```powershell
powershell -ExecutionPolicy Bypass -File backend/agent.ps1 -NodeId "YOUR_NODE_ID" -ServerUrl "http://YOUR_LOCAL_IP:8000"
```

### macOS / Linux Python Agent
```bash
python3 backend/agent.py --node-id "YOUR_NODE_ID" --server "http://YOUR_LOCAL_IP:8000"
```

---

## 📂 Submission Deliverables & Documentation

- `docs/problem statement.pdf` — Hackathon Final Round Requirements Document
- `docs/PRESENTATION_SLIDES.md` — Pitch Deck Presentation Slides for Judges
- `docs/DESIGN_NOTE.md` — Technical System Architecture & Design Note
- `implementation_plan.md` — Detailed Implementation Plan & Feature Breakdown
- `walkthrough.md` — Verification & Module Walkthrough

---

## 🏆 Hackathon Alignment & Team
- **Team Name:** Runtime Terrors
- **Track:** AI for Cluster Intelligence (Predictive Operations)
- **Event:** Daffodil International University — AI Innovation Hackathon 2026 (Final Round)
