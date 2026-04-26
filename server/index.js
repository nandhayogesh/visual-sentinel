'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const { createJob, getJob, subscribeJob, snapshotJob, setJobError, getJobsStoreHealth } = require('./jobs');
const { enqueueAnalysis, getQueueHealth, queueEnabled } = require('./queue');
const { runAnalysis } = require('./services/analyzer');

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Middleware ─────────────────────────────────────────────────────────────
const corsOriginRaw = process.env.CORS_ORIGIN || '*';
const corsOrigin = corsOriginRaw === '*'
  ? true
  : corsOriginRaw.split(',').map(v => v.trim()).filter(Boolean);
const jsonBodyLimit = process.env.BODY_LIMIT || '32kb';

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: jsonBodyLimit }));
app.set('trust proxy', 1);

app.use('/api/analyze', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analysis requests, please try again later.' },
}));

// ── POST /api/analyze ──────────────────────────────────────────────────────
// Accept a URL, create an async analysis job, return the jobId immediately.
app.post('/api/analyze', async (req, res) => {
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
  const created = await createJob(jobId);
  if (!created) {
    return res.status(500).json({ error: 'Failed to create analysis job.' });
  }

  if (queueEnabled) {
    try {
      await enqueueAnalysis(jobId, trimmed);
    } catch (err) {
      await setJobError(jobId, 'Failed to queue analysis task.');
      console.error(`[server] enqueue failed for ${jobId}:`, err);
      return res.status(503).json({ error: 'Analysis queue unavailable. Try again shortly.' });
    }
  } else {
    // Redis is optional in local/simple mode; analyze directly in-process.
    runAnalysis(jobId, trimmed).catch(err => {
      console.error(`[server] inline analysis failed for ${jobId}:`, err);
    });
  }

  return res.status(202).json({ jobId });
});

// ── GET /api/status/:jobId ─────────────────────────────────────────────────
// Return current job state: running progress, complete result, or error.
app.get('/api/status/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);

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

// ── GET /api/stream/:jobId ────────────────────────────────────────────────
// SSE job updates for realtime progress while preserving the polling API.
app.get('/api/stream/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  let unsubscribe = () => {};

  getJob(jobId).then(job => {
    if (!job) {
      res.status(404).json({ error: 'Job not found. It may have expired or the ID is invalid.' });
      return;
    }

    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const writeEvent = (eventName, data) => {
      res.write(`event: ${eventName}\n`);
      const payload = JSON.stringify(data ?? null);
      for (const line of payload.split(/\r?\n/)) {
        res.write(`data: ${line}\n`);
      }
      res.write('\n');
    };

    writeEvent('snapshot', snapshotJob(job));

    if (job.status === 'complete') {
      writeEvent('complete', { status: 'complete', result: job.result });
      res.end();
      return;
    }

    if (job.status === 'error') {
      writeEvent('error', { status: 'error', error: job.error });
      res.end();
      return;
    }

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': ping\n\n');
      }
    }, 20000);

    const cleanup = () => {
      clearInterval(heartbeat);
      unsubscribe();
      if (!res.writableEnded) {
        res.end();
      }
    };

    unsubscribe = subscribeJob(jobId, event => {
      if (event.type === 'progress') {
        writeEvent('progress', event.payload ?? event.snapshot);
        return;
      }

      if (event.type === 'complete') {
        writeEvent('complete', event.payload ?? event.snapshot);
        cleanup();
        return;
      }

      if (event.type === 'error') {
        writeEvent('error', event.payload ?? event.snapshot);
        cleanup();
      }
    });

    req.on('close', cleanup);
  }).catch(err => {
    console.error(`[server] stream init failed for ${jobId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to open stream.' });
    } else if (!res.writableEnded) {
      res.end();
    }
  });
});

// ── GET /api/health ────────────────────────────────────────────────────────
// Returns API key configuration status for the UI health check.
app.get('/api/health', async (_req, res) => {
  const [jobsStore, queue] = await Promise.all([getJobsStoreHealth(), getQueueHealth()]);

  res.json({
    status: 'ok',
    keys: {
      urlscan:      !!process.env.URLSCAN_API_KEY,
      virustotal:   !!process.env.VIRUSTOTAL_API_KEY,
      safebrowsing: !!process.env.SAFEBROWSING_API_KEY,
      phishtank:    !!process.env.PHISHTANK_APP_KEY,
      openphish:    true, // no API key required — uses public feed
    },
    infrastructure: {
      jobsStore,
      queue,
    },
  });
});

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  Visual Sentinel backend running on http://localhost:${PORT}`);
    console.log(`  API keys loaded:`);
    console.log(`    URLScan.io     : ${process.env.URLSCAN_API_KEY      ? '✓' : '✗ missing'}`);
    console.log(`    VirusTotal     : ${process.env.VIRUSTOTAL_API_KEY   ? '✓' : '✗ missing'}`);
    console.log(`    Safe Browsing  : ${process.env.SAFEBROWSING_API_KEY ? '✓' : '✗ missing'}`);
    console.log(`    PhishTank      : ${process.env.PHISHTANK_APP_KEY    ? '✓' : 'optional missing'}`);
    console.log(`    OpenPhish      : ✓ (no key needed)`);
    console.log(`  Queue backend: ${queueEnabled ? 'Redis' : 'Inline (no Redis)'}`);
    console.log();
  });
}

module.exports = app;
