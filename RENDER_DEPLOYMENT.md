# 🚀 ClusterMind — Render Deployment Guide

This guide provides step-by-step instructions for deploying the **ClusterMind AI-Driven Micro-Cluster Health & Anomaly Matrix** on [Render](https://render.com).

The project consists of two components:
1. **Backend**: Python FastAPI Microservice with IsolationForest AI anomaly detection (`backend/main.py`).
2. **Frontend**: Vite / React Single Page Dashboard application (`src/`).

---

## 🛠️ Option 1: 1-Click Infrastructure Deployment (Render Blueprint)

The repository includes a `render.yaml` Blueprint file for automatic configuration.

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository `md-tanjimul-islam/Cluster-Mind-Runtime_Terrors`.
4. Render will automatically detect `render.yaml` and configure:
   - **`clustermind-backend`** (Python Web Service)
   - **`clustermind-frontend`** (Static Site)
5. Click **Apply** to launch both services.

---

## 🔧 Option 2: Manual Deployment Guide

### Step 1: Deploy Backend FastAPI Microservice

1. Go to [Render Dashboard](https://dashboard.render.com/) → Click **New +** → **Web Service**.
2. Select repository `md-tanjimul-islam/Cluster-Mind-Runtime_Terrors`.
3. Configure the Web Service settings:
   - **Name**: `clustermind-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to target nodes (e.g., Singapore / Oregon).
   - **Branch**: `main` (or `master`)
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
4. Click **Create Web Service**.
5. Once deployed, copy your backend URL (e.g., `https://clustermind-backend.onrender.com`).

---

### Step 2: Deploy Frontend React Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/) → Click **New +** → **Static Site**.
2. Select repository `md-tanjimul-islam/Cluster-Mind-Runtime_Terrors`.
3. Configure Static Site settings:
   - **Name**: `clustermind-frontend`
   - **Branch**: `main` (or `master`)
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**:
     ```text
     dist
     ```
4. **Redirects & Rewrites** (for Single Page Application routing):
   - Navigate to **Redirects / Rewrites** tab in Render settings.
   - Add Rewrite Rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

## 📡 Environmental Verification & Endpoints

Once deployed:
- **Backend Anomaly API**: `https://<your-backend>.onrender.com/api/status`
- **Telemetry Ingestion**: `https://<your-backend>.onrender.com/api/ingest`
- **Frontend Dashboard**: `https://<your-frontend>.onrender.com`

---

## ⚡ Agent Connection Command for Live Compute Workers

Workers on local LAN or cloud environments can stream real-time metrics to your Render backend using:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path $env:TEMP 'install-clustermind.ps1'; Invoke-WebRequest 'https://<your-backend>.onrender.com/agents/install-windows-agent.ps1' -OutFile $p; & $p -Endpoint 'https://<your-backend>.onrender.com/api/ingest' -Token '<HMAC_TOKEN>' -NodeId 'gpu-worker-01'"
```
