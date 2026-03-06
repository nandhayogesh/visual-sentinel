'use strict';

/**
 * In-memory job store.
 * Each job holds: { status, progress, stage, result?, error? }
 * Automatically evicts jobs older than 30 minutes to prevent memory leaks.
 */

const jobs = new Map(); // jobId → { ...state, createdAt }

const JOB_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Evict stale jobs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}, 5 * 60 * 1000);

function createJob(id) {
  jobs.set(id, {
    status: 'running',
    progress: 0,
    stage: 'Starting…',
    result: null,
    error: null,
    createdAt: Date.now(),
  });
}

function getJob(id) {
  return jobs.get(id) ?? null;
}

function updateJob(id, patch) {
  const existing = jobs.get(id);
  if (!existing) return;
  jobs.set(id, { ...existing, ...patch });
}

function setJobComplete(id, result) {
  updateJob(id, { status: 'complete', progress: 100, stage: 'Analysis complete.', result });
}

function setJobError(id, message) {
  updateJob(id, { status: 'error', error: message });
}

module.exports = { createJob, getJob, updateJob, setJobComplete, setJobError };
