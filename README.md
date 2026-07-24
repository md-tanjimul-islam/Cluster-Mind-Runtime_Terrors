# ClusterMind

ClusterMind is a judge-ready prototype of an AI-powered, self-healing operations center for heterogeneous GPU/CPU clusters. It turns multi-signal telemetry into an explainable risk score, then demonstrates checkpointing, workload migration, recovery verification, and impact reporting.

## Run locally

The project has no build step or external runtime dependencies.

```bash
php -S 127.0.0.1:8080
```

Open `http://127.0.0.1:8080`.

## Best demo path

1. Start on **Overview** and point out the live six-node health grid.
2. Open **How prediction works** to explain the six-signal IsolationForest concept.
3. Select **Run failure simulation**.
4. Advance through Predict → Checkpoint → Migrate → Verify.
5. Show the updated recovery, prevented-failure, and savings metrics.
6. Export the incident report as judge-facing evidence.

## Connect actual devices

Select **Connect node → Real device**, enter a unique node name, and register it. ClusterMind generates a private token and a ready-to-run telemetry command. Run that command on the physical device; its CPU, GPU, memory, temperature, job count, calculated risk, and last-seen status then enter the same live node grid as the built-in cluster.

The connection dialog provides two commands:

- **Local test command:** uses the address currently open in the browser.
- **Wi-Fi / LAN command:** automatically uses the host computer's detected private IPv4 address and can be corrected manually when multiple network adapters are present.

The modal generates separate LAN commands for **Windows Command Prompt** and **macOS/Linux** because Windows CMD does not interpret single quotes as shell quoting.

The Windows command now downloads and starts `agents/windows-agent.ps1`. The agent reads live CPU and memory utilization through Windows CIM, reads NVIDIA GPU utilization and temperature through `nvidia-smi` when available, and submits telemetry every five seconds. Keep its terminal open during monitoring and press `Ctrl+C` to stop it.

Real nodes are marked:

- **Online:** telemetry received within the last 30 seconds.
- **Offline:** no telemetry received for more than 30 seconds.
- **Waiting:** registered but no telemetry has arrived yet.

The Windows CMD option installs a persistent per-user background agent under `%LOCALAPPDATA%\ClusterMind` and adds a launcher to the current user's Startup folder. It starts immediately, restarts automatically when the user signs in, keeps a log at `%LOCALAPPDATA%\ClusterMind\agent.log`, and does not require administrator privileges. The named mutex prevents duplicate agents for the same node.

To stop the persistent agent and remove its startup launcher:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ClusterMind\remove-windows-agent.ps1" -NodeId "YOUR_NODE_ID"
```

For a real deployment, wrap the generated request in a small five-second system service and populate the JSON values from Prometheus Node Exporter or NVIDIA DCGM. Never commit agent tokens to source control.

For pitch rehearsals, **Connect node → Demo node** adds a clearly labeled simulated device with healthy, watch, or critical starting conditions.

## Node inspection and deletion

Every node has a **View details** action with live metrics, source, last-seen time, connection information, and a reusable telemetry command. Built-in cluster nodes are protected. Deleting a user-added node requires typing its exact name; deleting a real node also requires a same-session CSRF token and removes its server-side registration, immediately revoking its agent token.

## Prototype architecture

- `index.php` — accessible single-page operations dashboard
- `assets/app.js` — live telemetry behavior, AI explanation, demo orchestration, and report export
- `assets/app.css` — responsive, reduced-motion-aware UI system
- `api.php` — status and self-healing simulation API
- `docs/` — hackathon rulebook (`AI_Innovation_Hackathon_Rulebook.pdf`), presentation slides (`ClusterMind_Presentation_Slides.pdf`), and concept note (`ClusterMind_Concept_Note.pdf`)

The included telemetry and financial impact are explicitly demo data. For production, replace `api.php` with Prometheus/DCGM ingestion, a Python IsolationForest service, and a real scheduler/checkpoint adapter.

## Hackathon alignment

- **Innovation:** closes the loop from prediction to autonomous healing.
- **Technical complexity:** multi-signal risk, checkpoint/migrate state machine, heterogeneous nodes, audit trail.
- **Real-world impact:** downtime, cost, and recovery metrics remain visible throughout the demo.
- **Scalability:** the UI and API contracts separate telemetry, inference, orchestration, and reporting.
- **Presentation:** a deterministic 90-second judge flow avoids a fragile live-demo sequence.
- **Collaboration:** components map cleanly to architecture/full-stack, implementation/integration, and SQA roles.

## Important rulebook note

The provided rulebook says final-round core code must be created during the hackathon day and that AI assistants may suggest but must not generate the entire solution. Treat this repository as a prototype/reference unless the organizers explicitly confirm it is eligible for submission.
