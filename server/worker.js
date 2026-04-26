'use strict';

require('dotenv').config();

const { Worker } = require('bullmq');
const { QUEUE_NAME, queueEnabled } = require('./queue');
const { runAnalysis } = require('./services/analyzer');

const concurrency = Number(process.env.WORKER_CONCURRENCY || 2);

if (!queueEnabled) {
  console.log('[worker] Queue disabled (no valid REDIS_URL). Worker not started.');
  process.exit(0);
}

const worker = new Worker(
  QUEUE_NAME,
  async job => {
    const { jobId, url } = job.data || {};
    if (!jobId || !url) {
      throw new Error('Invalid queue payload: missing jobId or url');
    }

    await runAnalysis(jobId, url);
    return { ok: true };
  },
  {
    connection: process.env.REDIS_URL,
    concurrency,
  }
);

worker.on('ready', () => {
  console.log(`[worker] Ready. Queue=${QUEUE_NAME}, concurrency=${concurrency}`);
});

worker.on('completed', job => {
  console.log(`[worker] Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] Failed job ${job?.id ?? 'unknown'}:`, err.message);
});

worker.on('error', err => {
  console.error('[worker] Worker error:', err.message);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
