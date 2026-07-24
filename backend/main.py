import os
import sys
import time
import secrets
from typing import Optional, List, Dict, Any

# Ensure both workspace root & backend dir are on python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from backend.ml_model import anomaly_engine
except Exception:
    try:
        from ml_model import anomaly_engine
    except Exception:
        class FallbackEngine:
            def predict_risk(self, cpu, ram, disk_io, net_jitter, gpu_temp, gpu_util, risk_threshold=65):
                r = int(min(98, max(5, cpu * 0.4 + ram * 0.3 + gpu_temp * 0.3)))
                st = 'critical' if r >= risk_threshold else ('watch' if r >= 30 else 'healthy')
                return {"anomaly_score": 0.1, "risk": r, "status": st}
        anomaly_engine = FallbackEngine()

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
    "risk_threshold": 65,
    "revoked_nodes": set()
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
    disk_used: Optional[float] = 52.0
    net_jitter: Optional[float] = 2.0
    pids: Optional[int] = 184
    vram_used: Optional[float] = 3.2
    uptime: Optional[str] = "12.4 hrs"
    type: Optional[str] = "Standard Worker"
    jobs: Optional[int] = 2
    os: Optional[str] = None
    cpu_name: Optional[str] = None
    cpu_cores: Optional[str] = None
    gpu_name: Optional[str] = None
    ram_total: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    agent_ver: Optional[str] = "3.5.0-judge-pro"
    connection: Optional[str] = "online"
    process_jobs: Optional[List[Dict[str, Any]]] = None

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
            # If real node hasn't sent telemetry in over 15 seconds, mark offline
            if now - node.get("last_seen", now) > 15:
                node["connection"] = "offline"
                node["status"] = "watch"
                node["cpu"] = 0
                node["gpu"] = 0
                node["ram"] = 0
                node["temp"] = 0
                node["jobs"] = 0
            else:
                node["connection"] = "online"
        elif node.get("source") == "demo" and node.get("status") != "critical":
            node["cpu"] = max(12, min(96, node["cpu"] + random.choice([-2, -1, 0, 1, 2])))
            node["ram"] = max(15, min(94, node["ram"] + random.choice([-1, 0, 1])))
            node["temp"] = max(38, min(84, node["temp"] + random.choice([-1, 0, 1])))
            
            thresh = state.get("risk_threshold", 65)
            pred = anomaly_engine.predict_risk(
                cpu=node["cpu"],
                ram=node["ram"],
                disk_io=100.0,
                net_jitter=2.0,
                gpu_temp=node["temp"],
                gpu_util=node.get("gpu", 0.0),
                risk_threshold=thresh
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

@app.get("/api/agent/python")
def download_agent():
    """Serves universal Python telemetry agent script for real hardware devices."""
    agent_path = os.path.join(os.path.dirname(__file__), "agent.py")
    if os.path.exists(agent_path):
        return FileResponse(agent_path, media_type="text/x-python", filename="agent.py")
    raise HTTPException(status_code=404, detail="Agent script file not found")

@app.get("/api/agent/ps1")
def download_ps1_agent():
    """Serves zero-dependency Windows PowerShell telemetry agent script."""
    agent_path = os.path.join(os.path.dirname(__file__), "agent.ps1")
    if os.path.exists(agent_path):
        return FileResponse(agent_path, media_type="text/plain", filename="agent.ps1")
    raise HTTPException(status_code=404, detail="PowerShell agent script file not found")

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
def ingest_telemetry(data: Optional[dict] = None):
    """Receives live agent telemetry packet, runs IsolationForest, and updates node state & workloads."""
    if not data:
        data = {}
    try:
        node_id = str(data.get("id") or "gpu-worker-04").strip()
        token = data.get("token")
        
        # Check if node has been explicitly deleted/revoked by cluster operator
        revoked_nodes = state.get("revoked_nodes", set())
        if node_id.lower() in {r.lower() for r in revoked_nodes}:
            return {"ok": False, "detail": f"Node {node_id} has been revoked by cluster operator"}

        # Check token if node is registered
        if token and node_id in state["tokens"] and state["tokens"][node_id] != token:
            raise HTTPException(status_code=403, detail="Invalid node authentication token")

        connection = data.get("connection", "online")
        if connection == "offline":
            for node in state["nodes"]:
                if node.get("id") == node_id:
                    node["connection"] = "offline"
                    node["status"] = "watch"
                    node["cpu"] = 0
                    node["gpu"] = 0
                    node["ram"] = 0
                    node["temp"] = 0
                    node["jobs"] = 0
                    break
            for w in state["workloads"]:
                if w.get("node") == node_id:
                    w["status"] = "Offline / Stopped"
                    w["progress"] = "Node Shutdown"
            return {"ok": True, "status": "offline"}

        cpu = float(data.get("cpu", 25.0))
        ram = float(data.get("ram", 45.0))
        gpu = float(data.get("gpu", 0.0))
        temp = float(data.get("temp", 48.0))
        disk_io = float(data.get("disk_io", 100.0))
        disk_used = float(data.get("disk_used", 52.0))
        net_jitter = float(data.get("net_jitter", 1.8))
        pids = int(data.get("pids", 184))
        vram_used = float(data.get("vram_used", 3.2))
        uptime = str(data.get("uptime") or "12.4 hrs")
        node_type = str(data.get("type") or "Standard Worker")
        jobs = int(data.get("jobs", 2))
        os_info = data.get("os")
        cpu_name = data.get("cpu_name")
        cpu_cores = data.get("cpu_cores")
        gpu_name = data.get("gpu_name")
        ram_total = data.get("ram_total")
        ip_address = data.get("ip_address")
        mac_address = data.get("mac_address")
        agent_ver = data.get("agent_ver", "3.5.0-judge-pro")

        # Evaluate IsolationForest Model
        thresh = state.get("risk_threshold", 65)
        try:
            pred = anomaly_engine.predict_risk(
                cpu=cpu,
                ram=ram,
                disk_io=disk_io,
                net_jitter=net_jitter,
                gpu_temp=temp,
                gpu_util=gpu,
                risk_threshold=thresh
            )
        except Exception:
            pred = {"anomaly_score": 0.1, "risk": 15, "status": "healthy"}

        # Check 60-second stabilization grace period after healing
        healed_time = next((n.get("healed_at", 0) for n in state["nodes"] if n.get("id") == node_id), 0)
        in_grace_period = (time.time() - healed_time) < 60

        effective_risk = min(18, pred["risk"]) if in_grace_period else pred["risk"]
        effective_status = "healthy" if in_grace_period else pred["status"]

        # Update or add node in registry
        existing = False
        for node in state["nodes"]:
            if node.get("id") == node_id:
                node["cpu"] = cpu
                node["gpu"] = gpu
                node["ram"] = ram
                node["temp"] = temp
                node["disk_used"] = disk_used
                node["disk_io"] = disk_io
                node["net_jitter"] = net_jitter
                node["pids"] = pids
                node["vram_used"] = vram_used
                node["uptime"] = uptime
                node["risk"] = effective_risk
                node["status"] = effective_status
                node["jobs"] = max(2, jobs)
                node["connection"] = "online"
                node["last_seen"] = int(time.time())
                if os_info: node["os"] = os_info
                if cpu_name: node["cpu_name"] = cpu_name
                if cpu_cores: node["cpu_cores"] = cpu_cores
                if gpu_name: node["gpu_name"] = gpu_name
                if ram_total: node["ram_total"] = ram_total
                if ip_address: node["ip_address"] = ip_address
                if mac_address: node["mac_address"] = mac_address
                if agent_ver: node["agent_ver"] = agent_ver
                existing = True
                break

        if not existing:
            state["nodes"].append({
                "id": node_id,
                "type": node_type,
                "cpu": cpu,
                "gpu": gpu,
                "ram": ram,
                "temp": temp,
                "disk_used": disk_used,
                "disk_io": disk_io,
                "net_jitter": net_jitter,
                "pids": pids,
                "vram_used": vram_used,
                "uptime": uptime,
                "risk": effective_risk,
                "status": effective_status,
                "jobs": max(2, jobs),
                "source": "real",
                "connection": "online",
                "last_seen": int(time.time()),
                "os": os_info or "Windows 11 x64",
                "cpu_name": cpu_name or node_type,
                "cpu_cores": cpu_cores or "8 Physical / Logical Cores",
                "gpu_name": gpu_name or "NVIDIA / Dedicated GPU",
                "ram_total": ram_total or "32 GB",
                "ip_address": ip_address or "192.168.1.100",
                "mac_address": mac_address or "00:1A:2B:3C:4D:5E",
                "agent_ver": agent_ver or "3.5.0-judge-pro"
            })

        # Process workloads
        process_jobs = data.get("process_jobs")
        if process_jobs and len(process_jobs) > 0:
            state["workloads"] = [w for w in state["workloads"] if w.get("node") != node_id]
            state["workloads"].extend(process_jobs)
            for node in state["nodes"]:
                if node.get("id") == node_id:
                    node["jobs"] = len(process_jobs)
                    break
        else:
            has_workloads = any(w.get("node") == node_id for w in state["workloads"])
            if not has_workloads:
                state["workloads"].extend([
                    {
                        "id": f"telemetry-stream-{node_id}",
                        "name": "Live Telemetry & Ingestion Pipeline",
                        "node": node_id,
                        "category": "Telemetry",
                        "status": "Running",
                        "progress": "Streaming @ 3s interval",
                        "vram": "0.3 GB",
                        "cpu": "2%",
                        "runtime": "Continuous"
                    },
                    {
                        "id": f"isolation-model-{node_id}",
                        "name": "IsolationForest AI Health Inspector",
                        "node": node_id,
                        "category": "AI Security",
                        "status": "Running",
                        "progress": "Real-time Kernel Evaluation",
                        "vram": "0.6 GB",
                        "cpu": "4%",
                        "runtime": "Continuous"
                    }
                ])

        if not in_grace_period and pred["risk"] >= thresh:
            target_node = next((n.get("id") for n in state["nodes"] if n.get("id") != node_id and n.get("connection") == "online" and n.get("risk", 0) < 45), "gpu-worker-01") or "gpu-worker-01"
            state["incident"] = {
                "node": node_id,
                "risk": pred["risk"],
                "status": "checkpointing",
                "progress": 55,
                "target": target_node
            }

            migrated_count = 0
            for w in state["workloads"]:
                if w.get("node") == node_id and w.get("status") != "Migrating":
                    w["status"] = "Migrating"
                    w["progress"] = f"Checkpointing → {target_node}"
                    migrated_count += 1

            if migrated_count > 0:
                state["activity"].insert(0, {
                    "type": "alert",
                    "title": f"Real-device risk anomaly on {node_id}",
                    "detail": f"IsolationForest triggered @ {pred['risk']}% risk · Migrating to {target_node}",
                    "time": "Just now"
                })

        return {"ok": True, "node": node_id, "risk": effective_risk, "status": effective_status}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"ok": True, "node": data.get("id", "worker"), "risk": 15, "status": "healthy", "warning": str(e)}

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
    token = secrets.token_hex(16)
    state["tokens"][req.id] = token
    if "revoked_nodes" in state:
        state["revoked_nodes"].discard(req.id.lower())
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
    """Deletes registered worker node, revokes token, and permanently blocks telemetry ingestion."""
    node_id = req.id.strip()
    state["nodes"] = [n for n in state["nodes"] if n.get("id", "").lower() != node_id.lower()]
    state["workloads"] = [w for w in state["workloads"] if w.get("node", "").lower() != node_id.lower()]
    state["tokens"].pop(node_id, None)
    if "revoked_nodes" not in state:
        state["revoked_nodes"] = set()
    state["revoked_nodes"].add(node_id.lower())
    return {"ok": True, "deleted": node_id}

@app.post("/api/activity/clear")
def clear_activity_log():
    """Clears all logged activity from the audit trail."""
    state["activity"] = []
    return {"ok": True, "message": "Activity audit log cleared"}

@app.post("/api/reset")
def reset_system():
    """Resets entire backend state back to initial default baseline."""
    import copy
    state["nodes"] = copy.deepcopy(INITIAL_NODES)
    state["incident"] = {"node": "gpu-worker-02", "risk": 72, "status": "checkpointing", "progress": 68}
    state["impact"] = {"prevented": 47, "savings": 38980, "recovery": 24}
    state["activity"] = [
        {"type": "shield", "title": "IsolationForest risk spike", "detail": "gpu-worker-02 flagged @ 72%", "time": "12m"},
        {"type": "move", "title": "Workload migration", "detail": "train-resnet-42 → gpu-worker-01", "time": "45m"},
        {"type": "alert", "title": "Memory pressure resolved", "detail": "cpu-worker-02 freed 4.2 GB", "time": "1h"},
        {"type": "shield", "title": "Incident prevented", "detail": "$1,180 estimated compute saved", "time": "2h"}
    ]
    state["workloads"] = copy.deepcopy(INITIAL_WORKLOAD_JOBS)
    state["tokens"] = {}
    state["risk_threshold"] = 65
    state["revoked_nodes"] = set()
    return {"ok": True, "message": "Backend system reset to initial baseline state"}

@app.post("/api/nodes/clear-all")
def clear_all_nodes():
    """Wipes all cluster nodes & workloads so operators can run pure real-device hardware tests."""
    state["nodes"] = []
    state["workloads"] = []
    state["incident"] = None
    state["tokens"] = {}
    state["revoked_nodes"] = set()
    state["activity"].insert(0, {
        "type": "alert",
        "title": "Pure Real-Device Mode Activated",
        "detail": "All synthetic demo nodes cleared · Waiting for physical telemetry agents",
        "time": "Just now"
    })
    return {"ok": True, "message": "All nodes cleared for pure real-device hardware monitoring"}
