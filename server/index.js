'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const { createJob, getJob } = require('./jobs');
const { runAnalysis } = require('./services/analyzer');

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── POST /api/analyze ──────────────────────────────────────────────────────
// Accept a URL, create an async analysis job, return the jobId immediately.
app.post('/api/analyze', (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'A valid "url" is required in the request body.' });
  }

  // Basic URL sanity check — must look like a hostname or URL
  const trimmed = url.trim();
  if (trimmed.length > 2048) {
    return res.status(400).json({ error: 'URL is too long.' });
  }

  const jobId = uuidv4();
  createJob(jobId);

  // Fire-and-forget — analysis runs async, client polls /api/status/:jobId
  runAnalysis(jobId, trimmed).catch(err => {
    console.error(`[server] runAnalysis uncaught for job ${jobId}:`, err);
  });

  return res.status(202).json({ jobId });
});

// ── GET /api/status/:jobId ─────────────────────────────────────────────────
// Return current job state: running progress, complete result, or error.
app.get('/api/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found. It may have expired or the ID is invalid.' });
  }

  if (job.status === 'running') {
    return res.json({ status: 'running', progress: job.progress, stage: job.stage });
  }

  if (job.status === 'error') {
    return res.json({ status: 'error', error: job.error });
  }

  // Complete — return full result
  return res.json(job.result);
});

// ── GET /api/health ────────────────────────────────────────────────────────
// Returns API key configuration status for the UI health check.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    keys: {
      urlscan:      !!process.env.URLSCAN_API_KEY,
      virustotal:   !!process.env.VIRUSTOTAL_API_KEY,
      safebrowsing: !!process.env.SAFEBROWSING_API_KEY,
      openphish:    true, // no API key required — uses public feed
    },
  });
});

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Visual Sentinel backend running on http://localhost:${PORT}`);
  console.log(`  API keys loaded:`);
  console.log(`    URLScan.io     : ${process.env.URLSCAN_API_KEY      ? '✓' : '✗ missing'}`);
  console.log(`    VirusTotal     : ${process.env.VIRUSTOTAL_API_KEY   ? '✓' : '✗ missing'}`);
  console.log(`    Safe Browsing  : ${process.env.SAFEBROWSING_API_KEY ? '✓' : '✗ missing'}`);
  console.log(`    OpenPhish      : ✓ (no key needed)`);
  console.log();
});
