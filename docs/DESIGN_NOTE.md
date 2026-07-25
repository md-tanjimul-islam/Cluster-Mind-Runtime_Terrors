# 📝 ClusterMind — System Architecture & Design Note
**Technical Design Document for AI Innovation Hackathon 2026**  
**Author:** Team Runtime Terrors  
**Project:** ClusterMind (AI-Powered Self-Healing Cluster Intelligence)  

---

## 1. Executive Summary & Objective

ClusterMind is an enterprise-grade AI cluster intelligence platform designed to eliminate compute downtime and training data loss across heterogeneous GPU/CPU worker nodes. The system continuously ingests 17-dimensional node telemetry, evaluates anomaly risk via an IsolationForest machine learning model, executes zero-downtime workload migrations, cryptographically verifies state checkpoints, and enforces Safe Mode quarantine protection.

---

## 2. Telemetry & Machine Learning Architecture

### 2.1 6D Telemetry Vector
Telemetry streams from physical and virtual worker nodes every 1–3 seconds:
$$\mathbf{x} = [\text{CPU}\%, \text{RAM}\%, \text{Disk IOPS}, \text{Net Jitter (ms)}, \text{GPU Temp }^\circ\text{C}, \text{GPU Util}\%]$$

### 2.2 Anomaly Engine (`backend/ml_model.py`)
- **Classifier:** `sklearn.ensemble.IsolationForest` ($N_{\text{estimators}}=100, \text{contamination}=0.1$).
- **Physical Stress Threshold Weighting:** Combines density-based outlier detection with physical stress thresholding:
  $$\text{PhysicalRisk} = \min(98, 25 + 0.40 \cdot \text{CPU}_{\text{stress}} + 0.30 \cdot \text{Temp}_{\text{stress}} + 0.20 \cdot \text{GPU}_{\text{stress}} + 0.10 \cdot \text{RAM}_{\text{stress}})$$
  Guarantees that severe physical stress ($\text{CPU} \ge 90\%, \text{Temp} \ge 75^\circ\text{C}, \text{GPU} \ge 85\%$) evaluates to a **Critical Risk Score ($\ge 75\%$)**.

---

## 3. Cryptographic Checkpoint Verification Engine

### 3.1 SHA-256 State Signatures
Each workload object $W_i$ tracks:
- `checkpoint_epoch`
- `checkpoint_batch`
- `checkpoint_hash` = $\text{SHA256}(W_i.\text{id} \parallel \text{epoch} \parallel \text{batch})[:12]$

### 3.2 Verification Algorithm (`backend/main.py`)
During `/api/heal`:
1. Source node checkpoint signature $H_{\text{src}}$ is read from the active workload state.
2. Workload is migrated to the target node, and target checkpoint signature $H_{\text{tgt}}$ is computed.
3. Cryptographic verification asserts $H_{\text{src}} == H_{\text{tgt}}$.
4. Returns `"status": "VERIFIED_EXACT"`, `"loss_steps": 0`, `"loss_seconds": 0.00`.

---

## 4. Safe Mode Quarantine State Machine (`NoSchedule`)

```
   ┌─────────────┐   Anomaly Risk ≥ 65%   ┌──────────────────────────┐
   │ Nominal /   │ ─────────────────────> │ Safe Mode (Quarantined)  │
   │ Healthy     │                        │  - NoSchedule Enforced   │
   └─────────────┘                        │  - Process Jobs Blocked  │
          ▲                               └──────────────────────────┘
          │                                            │
          └──────── 5 Consecutive Checks < 25% ────────┘
                    (Sustained Normalization)
```

- **Backend Enforcement:** Target node selection in `/api/ingest` and `/api/heal` excludes nodes where `safe_mode == True` or `status == "safe_mode"`.
- **Automatic Release:** Safe Mode auto-releases after 5 consecutive telemetry checks with Risk $<25\%$ and Temp $<70^\circ\text{C}$.

---

## 5. Dynamic Metrics & Explanatory Audit Trail

- **Average Recovery Duration:** Dynamically calculated from measured migration durations:
  $$\text{AvgRecovery} = \frac{1}{K} \sum_{k=1}^K t_k \quad (\text{e.g., } 24.3\text{s})$$
- **False Alarms Filtered:** Incremented whenever IsolationForest filters transient telemetry noise ($\text{Risk} \ge 30\% \to < 30\%$) without escalating to failover.
- **Audit Sentence Format:** Every audit entry appends a full plain-English sentence detailing workloads, SHA-256 hashes, recovery times, and Safe Mode states.

---

## 6. REST API Endpoint Contract

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Ingests real-time cluster nodes, workloads, incident, impact, and success report |
| `POST` | `/api/ingest` | Telemetry agent ingestion endpoint evaluating 6D IsolationForest risk |
| `POST` | `/api/heal` | Executes checkpoint migration, SHA-256 verification, and Safe Mode quarantine |
| `POST` | `/api/node/safemode` | Toggles Safe Mode quarantine state for worker nodes |
| `POST` | `/api/nodes/clear-all` | Clears synthetic data for Pure Real-Device Hardware Mode |
| `POST` | `/api/reset` | Resets system state back to baseline |
