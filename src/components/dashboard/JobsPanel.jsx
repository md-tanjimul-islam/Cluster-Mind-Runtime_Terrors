import React from 'react';
import { useCluster } from '../../context/ClusterContext';
import { Cpu } from 'lucide-react';

export function JobsPanel() {
  const { workloadJobs, jobFilter, setJobFilter } = useCluster();

  const filteredJobs = jobFilter === 'all'
    ? workloadJobs
    : workloadJobs.filter(j => j.category === jobFilter);

  return (
    <article className="panel jobs-panel" id="jobsPanel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Cluster Execution Engine</p>
          <h2 className="panel-title">
            Active Workloads &amp; Job Registry
            <span className="job-counter-badge">{workloadJobs.length} Active</span>
          </h2>
        </div>
        <div className="job-controls">
          <div className="filter-pills" role="group" aria-label="Job category filters">
            {['all', 'Training', 'Inference', 'Evaluation', 'Pipeline'].map(cat => (
              <button
                key={cat}
                className={`pill ${jobFilter === cat ? 'active' : ''}`}
                onClick={() => setJobFilter(cat)}
              >
                {cat === 'all' ? 'All Jobs' : cat === 'Evaluation' ? 'Eval' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="job-grid-list" aria-label="Active workload jobs list">
        {filteredJobs.length === 0 ? (
          <div className="nodes-empty">No active workloads found in category "{jobFilter}".</div>
        ) : (
          filteredJobs.map(job => {
            const isMigrating = job.status === 'Migrating';
            const statusClass = isMigrating ? 'status-migrating' : job.status === 'Running' ? 'status-running' : 'status-standby';
            const catClass    = ({ Training:'cat-train', Inference:'cat-infer', Evaluation:'cat-eval', Pipeline:'cat-pipe' })[job.category] || 'cat-gen';

            return (
              <div key={job.id} className={`job-card ${isMigrating ? 'job-card-warn' : ''}`}>
                <div className="job-left">
                  <div className={`job-icon ${catClass}`}>
                    <Cpu />
                  </div>
                  <div>
                    <div className="job-title-row">
                      <strong className="job-id">{job.id}</strong>
                      <span className={`job-cat-tag ${catClass}`}>{job.category}</span>
                    </div>
                    <span className="job-name">{job.name}</span>
                  </div>
                </div>

                <div className="job-meta">
                  <div className="job-meta-item">
                    <span className="meta-label">Node Placement</span>
                    <span className="meta-val font-mono">{job.node}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Progress / Phase</span>
                    <span className="meta-val">{job.progress}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Uptime</span>
                    <span className="meta-val font-mono">{job.runtime}</span>
                  </div>
                  <div className="job-meta-item">
                    <span className="meta-label">Status</span>
                    <span className={`job-status-pill ${statusClass}`}>
                      {isMigrating ? '⚡ ' : '🟢 '}{job.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
