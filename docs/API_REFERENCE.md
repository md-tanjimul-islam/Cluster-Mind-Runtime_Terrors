# ClusterMind — Complete REST API Reference

**Version:** 2.0.0  
**Base URL:** `http://localhost:8000`  
**Engine:** FastAPI + scikit-learn IsolationForest  
**Interactive Docs:** [`/docs`](http://localhost:8000/docs) (Swagger UI) · [`/redoc`](http://localhost:8000/redoc) (ReDoc)

All endpoints return JSON. All `POST` endpoints accept `application/json`.  
CORS is open (`*`) for local development.

---

## Table of Contents

- [GET /api/status](#get-apistatus)
- [POST /api/ingest](#post-apiingest)
- [POST /api/heal](#post-apiheal)
- [POST /api/predict](#post-apipredict)
- [POST /api/register](#post-apiregister)
- [POST /api/node](#post-apinode)
- [POST /api/node/safemode](#post-apinnodesafemode)
- [POST /api/delete](#post-apidelete)
- [POST /api/scenario](#post-apiscenario)
- [POST /api/config](#post-apiconfig)
- [POST /api/reset](#post-apireset)
- [POST /api/nodes/clear-all](#post-apinodesclear-all)
- [POST /api/activity/clear](#post-apiactivityclear)
- [GET /api/agent/python](#get-apiagentpython)
- [GET /api/agent/ps1](#get-apiagentps1)
- [Data Models](#data-models)
- [Error Responses](#error-responses)

---

## GET /api/status

Returns the complete real-time cluster state including all nodes, active workloads, the current incident, impact metrics, success report, and the activity audit trail.

Also performs per-poll logic:
- **Heartbeat timeout detection** for real hardware nodes (offline after 12–15s without telemetry)
- **Synthetic telemetry drift** ±1–2% random walk for demo/built-in nodes
- **IsolationForest re-evaluation** on each built-in node per poll cycle
- **Safe Mode status enforcement** on status field

### Request
```
GET /api/status
```
No body or parameters required.

### Response `200 OK`
```json
{
  "ok": true,
  "engine": "FastAPI + scikit-learn IsolationForest",
  "risk_threshold": 65,
  "nodes": [ <NodeObject>, ... ],
  "incident": <IncidentObject> | null,
  "impact": {
    "prevented": 47,
    "savings": 38980,
    "recovery": 24
  },
  "success_report": {
    "success_rate": "100%",
    "total_migrations": 47,
    "verified_recoveries": 47,
    "avg_recovery_time": "24s",
    "false_alarms": 2
  },
  "activity": [ <ActivityEntry>, ... ],
  "workloads": [ <WorkloadObject>, ... ]
}
```

### Node Object
```json
{
  "id": "gpu-worker-01",
  "type": "NVIDIA RTX 4060",
  "cpu": 61.0,
  "gpu": 74.0,
  "ram": 58.0,
  "temp": 67.0,
  "disk_io": 115.0,
  "disk_used": 52.0,
  "net_jitter": 3.8,
  "pids": 184,
  "vram_used": 6.8,
  "uptime": "12.4 hrs",
  "risk": 18,
  "status": "healthy",
  "safe_mode": false,
  "jobs": 3,
  "source": "built-in",
  "connection": "online",
  "last_seen": 1721896000,
  "os": "Windows 11 x64",
  "cpu_name": "NVIDIA RTX 4060",
  "cpu_cores": "8 Physical / Logical Cores",
  "gpu_name": "NVIDIA RTX 4060 Ti",
  "ram_total": "32 GB",
  "ip_address": "192.168.1.101",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "agent_ver": "3.5.0-judge-pro"
}
```

**`status` values:** `healthy` | `watch` | `critical` | `safe_mode`  
**`source` values:** `built-in` | `demo` | `real`  
**`connection` values:** `online` | `offline` | `waiting`

---

## POST /api/ingest

Primary telemetry ingestion endpoint consumed by `agent.py` and `agent.ps1`. Receives a live hardware telemetry packet, runs the 6D IsolationForest anomaly model, updates node state, manages workloads, checks Safe Mode auto-release, and triggers automatic incident creation if risk exceeds threshold.

### Request Body (`TelemetryPacket`)
```json
{
  "token": "a3f9b2c1d4e5...",
  "id": "my-gpu-machine",
  "cpu": 72.5,
  "gpu": 63.0,
  "ram": 68.2,
  "temp": 74.1,
  "disk_io": 145.0,
  "disk_used": 52.0,
  "net_jitter": 3.8,
  "pids": 214,
  "vram_used": 5.2,
  "uptime": "3.2 hrs",
  "type": "NVIDIA RTX 4090",
  "jobs": 2,
  "os": "Windows 11 x64",
  "cpu_name": "Intel Core i9-13900K",
  "cpu_cores": "24 Physical / 32 Logical Cores",
  "gpu_name": "NVIDIA GeForce RTX 4090",
  "ram_total": "64 GB",
  "ip_address": "192.168.1.105",
  "mac_address": "A1:B2:C3:D4:E5:F6",
  "agent_ver": "3.5.0-judge-pro",
  "connection": "online",
  "process_jobs": [
    {
      "id": "train-gpt-01",
      "name": "GPT-4 Fine-Tune",
      "node": "my-gpu-machine",
      "category": "Training",
      "status": "Running",
      "progress": "Epoch 12/50",
      "vram": "18.3 GB",
      "cpu": "72%",
      "runtime": "1h 22m"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique node identifier |
| `cpu` | `float` | ✅ | CPU utilization % |
| `ram` | `float` | ✅ | RAM utilization % |
| `temp` | `float` | ✅ | CPU/GPU temperature °C |
| `token` | `string` | ❌ | Auth token (from `/api/register`). Required if node was registered. |
| `gpu` | `float` | ❌ | GPU utilization % (default: `0.0`) |
| `disk_io` | `float` | ❌ | Disk IOPS (default: `100.0`) |
| `disk_used` | `float` | ❌ | Disk used % (default: `52.0`) |
| `net_jitter` | `float` | ❌ | Network jitter ms (default: `2.0`) |
| `pids` | `int` | ❌ | Active process count (default: `184`) |
| `vram_used` | `float` | ❌ | VRAM used GB (default: `3.2`) |
| `uptime` | `string` | ❌ | Node uptime string (default: `"12.4 hrs"`) |
| `type` | `string` | ❌ | Hardware type label |
| `jobs` | `int` | ❌ | Active job count (default: `2`) |
| `os` | `string` | ❌ | OS identifier string |
| `cpu_name` | `string` | ❌ | CPU model name |
| `cpu_cores` | `string` | ❌ | Core count descriptor |
| `gpu_name` | `string` | ❌ | GPU model name |
| `ram_total` | `string` | ❌ | Total RAM string (e.g., `"32 GB"`) |
| `ip_address` | `string` | ❌ | Node IP address |
| `mac_address` | `string` | ❌ | Node MAC address |
| `agent_ver` | `string` | ❌ | Agent version string |
| `connection` | `string` | ❌ | `"online"` or `"offline"` |
| `process_jobs` | `array` | ❌ | Active workload objects to register for this node |

### Behavior
1. Validates token if node is registered (returns 403 on mismatch)
2. Marks node offline immediately if `connection == "offline"`
3. Runs IsolationForest on `[cpu, ram, disk_io, net_jitter, temp, gpu]`
4. Applies 60-second post-heal grace period (caps risk at 18 during stabilization)
5. Upserts node in registry (adds if new, updates if existing)
6. Checks Safe Mode auto-release: requires 5 consecutive checks with risk < 25% and temp < 70°C
7. Updates workloads from `process_jobs` (blocked if node is in Safe Mode)
8. Auto-creates incident and begins migration if risk ≥ threshold and node not already in Safe Mode

### Response `200 OK`
```json
{
  "ok": true,
  "node": "my-gpu-machine",
  "risk": 71,
  "status": "critical"
}
```
> On revoked nodes: `{ "ok": false, "detail": "Node X has been revoked by cluster operator" }`

---

## POST /api/heal

Executes the full autonomous self-healing cycle:
1. **Checkpoint migration** — moves workloads from the incident node to a healthy target node
2. **SHA-256 cryptographic verification** — asserts `source_hash == target_hash`, guaranteeing 0 lost steps and 0.00s data loss
3. **Safe Mode quarantine** — places the recovered node in `NoSchedule` mode
4. **Audit trail entry** — appends full plain-English explanatory sentence

### Request Body (optional)
```json
{
  "node": "gpu-worker-02",
  "target": "gpu-worker-01"
}
```

If omitted, the server reads the active incident from state. Safe Mode quarantine is enforced — if the requested target is quarantined, an alternative healthy node is selected automatically.

### Response `200 OK`
```json
{
  "ok": true,
  "healed_node": "gpu-worker-02",
  "target_node": "gpu-worker-01",
  "recovery_check": {
    "verified": true,
    "source_checkpoint": "Epoch 47, Batch 1204 (sha256:e9a4f218c301)",
    "target_checkpoint": "Epoch 47, Batch 1204 (sha256:e9a4f218c301)",
    "loss_steps": 0,
    "loss_seconds": 0.00,
    "status": "VERIFIED_EXACT"
  },
  "safe_mode": true,
  "impact": {
    "prevented": 48,
    "savings": 40160,
    "recovery": 24
  },
  "success_report": {
    "success_rate": "100%",
    "total_migrations": 48,
    "verified_recoveries": 48,
    "avg_recovery_time": "24.3s",
    "false_alarms": 2
  },
  "activity": [ <ActivityEntry>, ... ]
}
```

**`recovery_check.status` values:** `VERIFIED_EXACT` | `CORRUPTED_CHECKPOINT`

---

## POST /api/predict

Runs the scikit-learn IsolationForest model directly on a provided 6D telemetry vector. Use for standalone risk score queries without ingesting a full telemetry packet.

### Request Body
```json
{
  "cpu": 88.5,
  "ram": 76.3,
  "disk_io": 310.0,
  "net_jitter": 12.5,
  "gpu_temp": 82.0,
  "gpu_util": 91.0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `cpu` | `float` | ✅ | CPU utilization % |
| `ram` | `float` | ✅ | RAM utilization % |
| `gpu_temp` | `float` | ✅ | GPU temperature °C |
| `disk_io` | `float` | ❌ | Disk IOPS (default: `100.0`) |
| `net_jitter` | `float` | ❌ | Network jitter ms (default: `2.0`) |
| `gpu_util` | `float` | ❌ | GPU utilization % (default: `0.0`) |

### Response `200 OK`
```json
{
  "ok": true,
  "prediction": {
    "anomaly_score": -0.12,
    "risk": 84,
    "status": "critical"
  }
}
```

**`status` values:** `healthy` | `watch` | `critical`  
**`risk`**: integer 0–98  
**`anomaly_score`**: raw IsolationForest score (negative = anomalous)

---

## POST /api/register

Registers a new node by ID and issues a unique cryptographic authentication token (`secrets.token_hex(16)`). The returned token must be sent with all future `/api/ingest` calls for this node.

### Request Body
```json
{
  "id": "my-new-node",
  "type": "NVIDIA RTX 4090 Worker"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique node identifier |
| `type` | `string` | ❌ | Human-readable hardware label (default: `"NVIDIA GPU worker"`) |

### Response `200 OK`
```json
{
  "ok": true,
  "id": "my-new-node",
  "token": "a3f9b2c1d4e56789abcdef0123456789"
}
```

> Also re-activates previously revoked nodes (removes from revoked set).

---

## POST /api/node

Directly adds or replaces a node entry in the registry. Used by the ConnectNode Wizard to pre-register a node before its agent starts streaming telemetry.

### Request Body
```json
{
  "id": "my-new-node",
  "token": "a3f9b2c1d4e56789abcdef0123456789",
  "type": "NVIDIA RTX 4090 Worker",
  "cpu": 0,
  "gpu": 0,
  "ram": 0,
  "temp": 0,
  "risk": 0,
  "status": "healthy",
  "jobs": 0,
  "source": "real",
  "connection": "waiting"
}
```

All fields except `id` are optional. `token` — if provided — is stored and used to validate future `/api/ingest` calls.

### Response `200 OK`
```json
{
  "ok": true,
  "node": { <full node object> }
}
```

---

## POST /api/node/safemode

Manually toggles the Safe Mode (Quarantine / NoSchedule) state for a specific node. When enabled, the node is excluded from workload scheduling and all incoming workloads are blocked.

### Request Body
```json
{
  "id": "gpu-worker-02",
  "safe_mode": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Node ID to toggle |
| `safe_mode` | `bool` | ✅ | `true` to quarantine, `false` to release |

### Response `200 OK`
```json
{
  "ok": true,
  "id": "gpu-worker-02",
  "safe_mode": true,
  "nodes": [ <NodeObject>, ... ],
  "activity": [ <ActivityEntry>, ... ],
  "impact": { ... },
  "success_report": { ... }
}
```

---

## POST /api/delete

Deletes a node from the registry, removes all its workloads, revokes its auth token, and permanently blocks any future telemetry from that node ID.

### Request Body
```json
{
  "id": "gpu-worker-02"
}
```

### Response `200 OK`
```json
{
  "ok": true,
  "deleted": "gpu-worker-02"
}
```

> Revoked node IDs are stored in a server-side set. Any subsequent `/api/ingest` from that node ID returns `{ "ok": false, "detail": "Node X has been revoked by cluster operator" }`.

---

## POST /api/scenario

Injects a simulated hardware failure scenario into the demo cluster. Useful for judge demos and testing the self-healing pipeline without real hardware.

### Request Body
```json
{
  "type": "thermal"
}
```

| `type` | Effect |
|---|---|
| `thermal` | Sets `gpu-worker-02` to CPU 91%, Temp 88°C, Risk 84% (critical), starts incident |
| `memory` | Sets `gpu-worker-02` to RAM 96%, Risk 78% (critical), starts incident |
| `network` | Sets `gpu-worker-02` to CPU 84%, Risk 71% (critical), starts incident |
| `reset` | Resets `gpu-worker-02` to healthy baseline, clears incident |

### Response `200 OK`
```json
{
  "ok": true,
  "scenario": "thermal",
  "incident": {
    "node": "gpu-worker-02",
    "risk": 84,
    "status": "checkpointing",
    "progress": 15,
    "target": "gpu-worker-01"
  }
}
```

---

## POST /api/config

Updates the global IsolationForest anomaly sensitivity threshold. Nodes with risk above this value trigger automatic incident creation and workload migration.

### Request Body
```json
{
  "risk_threshold": 70
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `risk_threshold` | `int` | `65` | Risk % above which incidents auto-trigger (range: 1–98) |

### Response `200 OK`
```json
{
  "ok": true,
  "risk_threshold": 70
}
```

---

## POST /api/reset

Resets the entire backend state to the initial demo baseline. Clears all real device nodes, restores built-in synthetic nodes, resets impact counters, and reinitializes the audit log.

### Request
```
POST /api/reset
```
No body required.

### Response `200 OK`
```json
{
  "ok": true,
  "message": "Backend system reset to initial baseline state"
}
```

---

## POST /api/nodes/clear-all

Clears **all** nodes and workloads — both built-in synthetic and real hardware. Activates Pure Real-Device Hardware Mode. Used when logging in as `real@clustermind.ai`.

### Request
```
POST /api/nodes/clear-all
```
No body required.

### Response `200 OK`
```json
{
  "ok": true,
  "message": "All nodes & synthetic data cleared for pure real-device hardware monitoring"
}
```

---

## POST /api/activity/clear

Clears all entries from the activity audit log.

### Request
```
POST /api/activity/clear
```
No body required.

### Response `200 OK`
```json
{
  "ok": true,
  "message": "Activity audit log cleared"
}
```

---

## GET /api/agent/python

Downloads the universal Python telemetry agent script (`agent.py`) as a file download. Works on macOS, Linux, and Windows (with Python installed).

### Response
- **Content-Type:** `text/x-python`
- **Content-Disposition:** `attachment; filename="agent.py"`
- Returns `404` if agent script file not found on server.

---

## GET /api/agent/ps1

Downloads the zero-dependency Windows PowerShell telemetry agent script (`agent.ps1`).

### Response
- **Content-Type:** `text/plain`
- **Content-Disposition:** `attachment; filename="agent.ps1"`
- Returns `404` if script file not found on server.

---

## Data Models

### IncidentObject
```json
{
  "node": "gpu-worker-02",
  "risk": 72,
  "status": "checkpointing",
  "progress": 68,
  "target": "gpu-worker-01",
  "start_time": 1721896032.5
}
```

### WorkloadObject
```json
{
  "id": "train-resnet-42",
  "name": "PyTorch ResNet-50 Training",
  "node": "gpu-worker-01",
  "category": "Training",
  "status": "Running",
  "progress": "Epoch 47/100",
  "vram": "6.8 GB",
  "cpu": "42%",
  "runtime": "2h 14m",
  "checkpoint_epoch": 47,
  "checkpoint_batch": 1204,
  "checkpoint_hash": "sha256:e9a4f218c301"
}
```

**`status` values:** `Running` | `Migrating` | `Offline / Stopped`  
**`category` values:** `Training` | `Inference` | `Evaluation` | `Pipeline` | `Telemetry` | `AI Security`

### ActivityEntry
```json
{
  "type": "shield",
  "title": "Recovery Verified & Safe Mode Engaged (gpu-worker-02)",
  "detail": "Workload PyTorch ResNet-50 verified at exact checkpoint (sha256:e9a4f218c301) on gpu-worker-01 with 0 lost steps and 0.00s data loss in 24.3s. Node gpu-worker-02 placed in Safe Mode (Quarantined) to block new work.",
  "time": "Just now",
  "verified": true,
  "lost_steps": 0
}
```

**`type` values:** `shield` | `move` | `alert`

---

## Error Responses

| Status | Meaning | Example |
|---|---|---|
| `403 Forbidden` | Invalid or missing auth token for a registered node | `{ "detail": "Invalid node authentication token" }` |
| `404 Not Found` | Agent script file missing on server | `{ "detail": "Agent script file not found" }` |
| `200 OK` (soft error) | Revoked node attempting to ingest | `{ "ok": false, "detail": "Node X has been revoked by cluster operator" }` |
| `200 OK` (with warning) | Ingest succeeded but a non-critical internal error occurred | `{ "ok": true, "node": "...", "risk": 15, "status": "healthy", "warning": "<error message>" }` |

> **Note:** The API uses soft errors (HTTP 200 with `"ok": false`) for most operational states to maintain agent compatibility. Only token validation failures return HTTP 4xx.

---

## Rate Limiting & CORS

- **CORS:** Open (`allow_origins=["*"]`) — suitable for local LAN development. For production, restrict to specific origins.
- **Rate limiting:** Not implemented at the API level. Agents are designed to stream at **3-second intervals**. Heartbeat timeout detection triggers after **12 seconds** of silence from a real node.
- **Authentication:** Per-node token-based (`secrets.token_hex(16)`). Tokens are stored in-memory and reset on `/api/reset`.
