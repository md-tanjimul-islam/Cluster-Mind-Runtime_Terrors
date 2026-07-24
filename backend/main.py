import time
import secrets
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ml_model import anomaly_engine

app = FastAPI(
    title="ClusterMind AI Engine API",
    description="Python FastAPI + scikit-learn IsolationForest Telemetry & Autonomous Self-Healing Microservice",
    version="2.0.0"
)

import os
from fastapi.staticfiles import StaticFiles

# Enable CORS for Vite dev server & local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount agents directory for serving PowerShell/Bash installer scripts statically
agents_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agents")
if os.path.exists(agents_dir):
    app.mount("/agents", StaticFiles(directory=agents_dir), name="agents")

# In-Memory State Registry
INITIAL_NODES = [
    {"id": "gpu-worker-01", "type": "NVIDIA RTX 4060", "cpu": 61, "gpu": 74, "ram": 58, "temp": 67, "disk_io": 115, "net_jitter": 3.8, "risk": 18, "status": "healthy", "jobs": 3, "source": "built-in"},
    {"id": "gpu-worker-02", "type": "NVIDIA RTX 3060", "cpu": 82, "gpu": 41, "ram": 89, "temp": 81, "disk_io": 240, "net_jitter": 14.2, "risk": 72, "status": "critical", "jobs": 2, "source": "built-in"},
    {"id": "gpu-worker-03", "type": "NVIDIA GTX 1650", "cpu": 48, "gpu": 66, "ram": 52, "temp": 63, "disk_io": 98, "net_jitter": 2.1, "risk": 23, "status": "healthy", "jobs": 2, "source": "built-in"},
    {"id": "cpu-worker-01", "type": "Apple M2 · 8 cores", "cpu": 57, "gpu": 0, "ram": 64, "temp": 54, "disk_io": 88, "net_jitter": 1.9, "risk": 12, "status": "healthy", "jobs": 4, "source": "built-in"},
    {"id": "cpu-worker-02", "type": "Intel i7 · 12 cores", "cpu": 69, "gpu": 0, "ram": 71, "temp": 61, "disk_io": 145, "net_jitter": 4.5, "risk": 31, "status": "watch", "jobs": 5, "source": "built-in"},
    {"id": "controller-01", "type": "Control plane", "cpu": 24, "gpu": 0, "ram": 39, "temp": 45, "disk_io": 42, "net_jitter": 0.8, "risk": 7, "status": "healthy", "jobs": 0, "source": "built-in"}
]

INITIAL_WORKLOAD_JOBS = [
    {"id": "train-resnet-42", "name": "PyTorch ResNet-50 Training", "node": "gpu-worker-01", "category": "Training", "status": "Running", "progress": "Epoch 47/100", "vram": "6.8 GB", "cpu": "42%", "runtime": "2h 14m"},
    {"id": "infer-llm-07", "name": "Llama-3 8B Inference Engine", "node": "gpu-worker-02", "category": "Inference", "status": "Migrating", "progress": "Checkpoint 68%", "vram": "9.1 GB", "cpu": "68%", "runtime": "5h 02m"},
    {"id": "batch-eval-09", "name": "BERT Validation Batch", "node": "gpu-worker-03", "category": "Evaluation", "status": "Running", "progress": "Batch 140/200", "vram": "3.2 GB", "cpu": "31%", "runtime": "0h 45m"},
    {"id": "fine-tune-sdxl-02", "name": "Stable Diffusion XL Fine-Tune", "node": "gpu-worker-01", "category": "Training", "status": "Running", "progress": "Step 4,200/10,000", "vram": "7.4 GB", "cpu": "56%", "runtime": "4h 10m"},
    {"id": "embed-vector-14", "name": "Pinecone Vector Embedding Engine", "node": "cpu-worker-01", "category": "Pipeline", "status": "Running", "progress": "1.2M Docs Processed", "vram": "N/A", "cpu": "57%", "runtime": "8h 30m"},
    {"id": "etl-pipeline-05", "name": "Telemetry Aggregator Stream", "node": "cpu-worker-02", "category": "Pipeline", "status": "Running", "progress": "Stream Active (1.4k/s)", "vram": "N/A", "cpu": "69%", "runtime": "12h 15m"}
]

state = {
    "nodes": INITIAL_NODES,
    "incident": {"node": "gpu-worker-02", "risk": 72, "status": "checkpointing", "progress": 68},
    "impact": {"prevented": 47, "savings": 38980, "recovery": 24},
    "activity": [
        {"type": "shield", "title": "IsolationForest risk spike", "detail": "gpu-worker-02 flagged @ 72%", "time": "12m"},
        {"type": "move", "title": "Workload migration", "detail": "train-resnet-42 → gpu-worker-01", "time": "45m"},
        {"type": "alert", "title": "Memory pressure resolved", "detail": "cpu-worker-02 freed 4.2 GB", "time": "1h"},
        {"type": "shield", "title": "Incident prevented", "detail": "$1,180 estimated compute saved", "time": "2h"}
    ],
    "workloads": INITIAL_WORKLOAD_JOBS,
    "tokens": {},
    "risk_threshold": 65
}

# Pydantic Schemas
class TelemetryPacket(BaseModel):
    token: Optional[str] = None
    id: str
    cpu: float
    gpu: Optional[float] = 0.0
    ram: float
    temp: float
    disk_io: Optional[float] = 100.0
    net_jitter: Optional[float] = 2.0
    type: Optional[str] = "Standard Worker"
    jobs: Optional[int] = 2
    os: Optional[str] = None
    cpu_name: Optional[str] = None
    gpu_name: Optional[str] = None
    ram_total: Optional[str] = None
    agent_ver: Optional[str] = "3.2.0-win"
    process_jobs: Optional[List[Dict[str, Any]]] = None
    connection: Optional[str] = None

class PredictRequest(BaseModel):
    cpu: float
    ram: float
    disk_io: Optional[float] = 100.0
    net_jitter: Optional[float] = 2.0
    gpu_temp: float
    gpu_util: Optional[float] = 0.0

class RegisterRequest(BaseModel):
    id: str
    type: Optional[str] = "NVIDIA GPU worker"

class ScenarioRequest(BaseModel):
    type: str # 'thermal' | 'memory' | 'network' | 'reset'

class DeleteRequest(BaseModel):
    id: str

import random

# API Routes
@app.get("/api/status")
def get_status():
    """Returns current cluster telemetry, nodes, incident state, and workloads with heartbeat timeout monitoring."""
    now = int(time.time())
    for node in state["nodes"]:
        # 1. Heartbeat Timeout & Offline Detection for Real Hardware Nodes
        if node.get("source") == "real":
            last_seen = node.get("last_seen", 0)
            if last_seen > 0 and (now - last_seen) > 12:
                node["connection"] = "offline"
                node["cpu"] = 0
                node["gpu"] = 0
                node["ram"] = 0
                node["temp"] = 0
                node["jobs"] = 0
                node["status"] = "watch"

                # Mark active workloads for this node as offline/stopped
                for w in state["workloads"]:
                    if w.get("node") == node["id"]:
                        w["status"] = "Offline / Stopped"
                        w["progress"] = "Heartbeat Timed Out"

                if (now - last_seen) > 30:
                    node["status"] = "critical"
                    node["risk"] = 94

        # 2. Organic Metric Jitter for Built-in Demo Nodes
        elif node.get("source") == "built-in" and node["status"] != "critical":
            node["cpu"] = max(10, min(98, node["cpu"] + random.randint(-2, 2)))
            node["ram"] = max(15, min(95, node["ram"] + random.randint(-1, 1)))
            if node.get("gpu", 0) > 0:
                node["gpu"] = max(5, min(99, node["gpu"] + random.randint(-3, 3)))
            node["temp"] = max(35, min(85, node["temp"] + random.randint(-1, 1)))

            pred = anomaly_engine.predict_risk(
                cpu=node["cpu"],
                ram=node["ram"],
                disk_io=node.get("disk_io", 100.0),
                net_jitter=node.get("net_jitter", 2.0),
                gpu_temp=node["temp"],
                gpu_util=node.get("gpu", 0.0),
                risk_threshold=state.get("risk_threshold", 65)
            )
            node["risk"] = pred["risk"]

    return {
        "ok": True,
        "engine": "FastAPI + scikit-learn IsolationForest",
        "risk_threshold": state.get("risk_threshold", 65),
        "nodes": state["nodes"],
        "incident": state["incident"],
        "impact": state["impact"],
        "activity": state["activity"],
        "workloads": state["workloads"]
    }

class ConfigRequest(BaseModel):
    risk_threshold: Optional[int] = 65

@app.post("/api/config")
def update_config(req: ConfigRequest):
    """Updates global IsolationForest anomaly sensitivity threshold."""
    if req.risk_threshold:
        state["risk_threshold"] = req.risk_threshold
    return {"ok": True, "risk_threshold": state["risk_threshold"]}

@app.post("/api/predict")
def predict_anomaly(req: PredictRequest):
    """Runs scikit-learn IsolationForest model inference on a 6D telemetry vector."""
    res = anomaly_engine.predict_risk(
        cpu=req.cpu,
        ram=req.ram,
        disk_io=req.disk_io,
        net_jitter=req.net_jitter,
        gpu_temp=req.gpu_temp,
        gpu_util=req.gpu_util,
        risk_threshold=state.get("risk_threshold", 65)
    )
    return {"ok": True, "prediction": res}

@app.post("/api/ingest")
def ingest_telemetry(pkt: TelemetryPacket):
    """Receives live agent telemetry packet, runs IsolationForest, and updates node state & workloads."""
    # Check token if node is real
    if pkt.token and pkt.id in state["tokens"] and state["tokens"][pkt.id] != pkt.token:
        raise HTTPException(status_code=403, detail="Invalid node authentication token")

    # Handle explicit offline signal from agent shutdown
    if pkt.connection == "offline":
        for node in state["nodes"]:
            if node["id"] == pkt.id:
                node["connection"] = "offline"
                node["status"] = "watch"
                node["cpu"] = 0
                node["gpu"] = 0
                node["ram"] = 0
                node["temp"] = 0
                node["jobs"] = 0
                break
        for w in state["workloads"]:
            if w.get("node") == pkt.id:
                w["status"] = "Offline / Stopped"
                w["progress"] = "Node Shutdown"
        return {"ok": True, "status": "offline"}

    # Evaluate IsolationForest Model
    thresh = state.get("risk_threshold", 65)
    pred = anomaly_engine.predict_risk(
        cpu=pkt.cpu,
        ram=pkt.ram,
        disk_io=pkt.disk_io or 100.0,
        net_jitter=pkt.net_jitter or 2.0,
        gpu_temp=pkt.temp,
        gpu_util=pkt.gpu or 0.0,
        risk_threshold=thresh
    )

    # Check 60-second stabilization grace period after healing
    healed_time = next((n.get("healed_at", 0) for n in state["nodes"] if n["id"] == pkt.id), 0)
    in_grace_period = (time.time() - healed_time) < 60

    effective_risk = min(18, pred["risk"]) if in_grace_period else pred["risk"]
    effective_status = "healthy" if in_grace_period else pred["status"]

    # Update or add node in registry
    existing = False
    for node in state["nodes"]:
        if node["id"] == pkt.id:
            node["cpu"] = pkt.cpu
            node["gpu"] = pkt.gpu
            node["ram"] = pkt.ram
            node["temp"] = pkt.temp
            node["risk"] = effective_risk
            node["status"] = effective_status
            node["jobs"] = max(2, pkt.jobs or 2)
            node["connection"] = "online"
            node["last_seen"] = int(time.time())
            if pkt.os: node["os"] = pkt.os
            if pkt.cpu_name: node["cpu_name"] = pkt.cpu_name
            if pkt.gpu_name: node["gpu_name"] = pkt.gpu_name
            if pkt.ram_total: node["ram_total"] = pkt.ram_total
            if pkt.agent_ver: node["agent_ver"] = pkt.agent_ver
            existing = True
            break

    if not existing:
        state["nodes"].append({
            "id": pkt.id,
            "type": pkt.type,
            "cpu": pkt.cpu,
            "gpu": pkt.gpu,
            "ram": pkt.ram,
            "temp": pkt.temp,
            "risk": effective_risk,
            "status": effective_status,
            "jobs": max(2, pkt.jobs or 2),
            "source": "real",
            "connection": "online",
            "last_seen": int(time.time()),
            "os": pkt.os or "Windows 11 x64",
            "cpu_name": pkt.cpu_name or pkt.type,
            "gpu_name": pkt.gpu_name or "NVIDIA / Dedicated GPU",
            "ram_total": pkt.ram_total or "32 GB",
            "agent_ver": pkt.agent_ver or "3.2.0-win"
        })

    # Sync process workloads for this node
    if pkt.process_jobs and len(pkt.process_jobs) > 0:
        state["workloads"] = [w for w in state["workloads"] if w["node"] != pkt.id]
        state["workloads"].extend(pkt.process_jobs)
        for node in state["nodes"]:
            if node["id"] == pkt.id:
                node["jobs"] = len(pkt.process_jobs)
                break
    else:
        has_workloads = any(w["node"] == pkt.id for w in state["workloads"])
        if not has_workloads:
            state["workloads"].extend([
                {
                    "id": f"telemetry-stream-{pkt.id}",
                    "name": "Live Telemetry & Ingestion Pipeline",
                    "node": pkt.id,
                    "category": "Telemetry",
                    "status": "Running",
                    "progress": "Streaming @ 5s interval",
                    "vram": "0.3 GB",
                    "cpu": "2%",
                    "runtime": "Continuous"
                },
                {
                    "id": f"isolation-model-{pkt.id}",
                    "name": "IsolationForest AI Health Inspector",
                    "node": pkt.id,
                    "category": "AI Security",
                    "status": "Running",
                    "progress": "Real-time Kernel Evaluation",
                    "vram": "0.6 GB",
                    "cpu": "4%",
                    "runtime": "Continuous"
                }
            ])
    # IsolationForest Real-Time Workload Migration for Real Devices
    if pred["risk"] >= thresh:
        target_node = next((n["id"] for n in state["nodes"] if n["id"] != pkt.id and n.get("connection") == "online" and n.get("risk", 0) < 45), "gpu-worker-01")
        
        state["incident"] = {
            "node": pkt.id,
            "risk": pred["risk"],
            "status": "checkpointing",
            "progress": 55,
            "target": target_node
        }

        migrated_count = 0
        for w in state["workloads"]:
            if w.get("node") == pkt.id and w.get("status") != "Migrating":
                w["status"] = "Migrating"
                w["progress"] = f"Checkpointing → {target_node}"
                migrated_count += 1

        if migrated_count > 0:
            state["activity"].insert(0, {
                "type": "move",
                "title": f"IsolationForest Migration ({pkt.id})",
                "detail": f"{migrated_count} workload(s) migrating → {target_node}",
                "time": "Just now"
            })

    return {
        "ok": True,
        "id": pkt.id,
        "isolation_forest_risk": pred["risk"],
        "anomaly_score": pred["anomaly_score"],
        "status": pred["status"]
    }

class AddNodeRequest(BaseModel):
    id: str
    type: Optional[str] = "NVIDIA GPU worker"
    cpu: Optional[float] = 0
    gpu: Optional[float] = 0
    ram: Optional[float] = 0
    temp: Optional[float] = 0
    risk: Optional[float] = 0
    status: Optional[str] = "healthy"
    jobs: Optional[int] = 0
    source: Optional[str] = "real"
    connection: Optional[str] = "waiting"

@app.post("/api/register")
def register_node(req: RegisterRequest):
    token = hashlib.sha256(f"{req.id}-{time.time()}".encode()).hexdigest()[:32]
    state["tokens"][req.id] = token
    return {"ok": True, "id": req.id, "token": token}

@app.post("/api/node")
def add_node(req: AddNodeRequest):
    node_dict = req.dict()
    node_dict["last_seen"] = int(time.time())
    state["nodes"] = [n for n in state["nodes"] if n["id"] != req.id]
    state["nodes"].append(node_dict)
    return {"ok": True, "node": node_dict}

@app.post("/api/scenario")
def inject_scenario(req: ScenarioRequest):
    """Injects simulated failure scenario for judge demo."""
    stype = req.type
    target_node = "gpu-worker-02"

    for n in state["nodes"]:
        if n["id"] == target_node:
            if stype == "thermal":
                n.update({"temp": 88, "risk": 84, "status": "critical", "cpu": 91})
                state["incident"] = {"node": target_node, "risk": 84, "status": "checkpointing", "progress": 15, "target": "gpu-worker-01"}
            elif stype == "memory":
                n.update({"ram": 96, "risk": 78, "status": "critical"})
                state["incident"] = {"node": target_node, "risk": 78, "status": "checkpointing", "progress": 25, "target": "gpu-worker-01"}
            elif stype == "network":
                n.update({"cpu": 84, "risk": 71, "status": "critical"})
                state["incident"] = {"node": target_node, "risk": 71, "status": "checkpointing", "progress": 30, "target": "gpu-worker-01"}
            elif stype == "reset":
                n.update({"cpu": 42, "gpu": 63, "ram": 48, "temp": 58, "risk": 11, "status": "healthy"})
                state["incident"] = None
            break

    return {"ok": True, "scenario": stype, "incident": state["incident"]}

class HealRequest(BaseModel):
    node: Optional[str] = None
    target: Optional[str] = None

@app.post("/api/heal")
def complete_healing(req: Optional[HealRequest] = None):
    """Executes autonomous IsolationForest checkpoint & workload migration rebalance across nodes."""
    inc_node = (req.node if req and req.node else None) or (state["incident"].get("node") if state["incident"] else "gpu-worker-02")
    target_node = (req.target if req and req.target else None) or (state["incident"].get("target", "gpu-worker-01") if state["incident"] else "gpu-worker-01")

    # Re-assign workloads from high-risk node to target node
    for w in state["workloads"]:
        if w.get("node") == inc_node or (w.get("status") == "Migrating" and w.get("node") == inc_node):
            w["node"] = target_node
            w["status"] = "Running"
            w["progress"] = f"Active on {target_node}"

    # Restore health state of incident node & activate 60s stabilization window
    for n in state["nodes"]:
        if n["id"] == inc_node:
            n["status"] = "healthy"
            n["risk"] = 14
            n["healed_at"] = int(time.time())

    if state["incident"] and state["incident"].get("node") == inc_node:
        state["incident"] = None

    state["impact"]["prevented"] += 1
    state["impact"]["savings"] += 1180

    state["activity"].insert(0, {
        "type": "shield",
        "title": f"Self-healing completed for {inc_node}",
        "detail": f"Workloads rebalanced to {target_node} · 0 data loss",
        "time": "Just now"
    })

    return {"ok": True, "healed_node": inc_node, "target_node": target_node, "impact": state["impact"]}

@app.post("/api/delete")
def delete_node(req: DeleteRequest):
    """Deletes registered worker node and revokes token."""
    state["nodes"] = [n for n in state["nodes"] if n["id"] != req.id]
    state["tokens"].pop(req.id, None)
    return {"ok": True, "deleted": req.id}

@app.post("/api/activity/clear")
def clear_activity_log():
    """Clears all logged activity from the audit trail."""
    state["activity"] = []
    return {"ok": True, "message": "Activity audit log cleared"}
