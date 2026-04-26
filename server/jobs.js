'use strict';

/**
 * Job store with automatic fallback:
 * - Redis mode when REDIS_URL is a valid redis:// or rediss:// URL.
 * - In-memory mode when Redis is unavailable/not configured.
 */

const JOB_TTL_MS = 30 * 60 * 1000;
const JOB_TTL_SECONDS = Math.floor(JOB_TTL_MS / 1000);
const KEY_PREFIX = 'visual-sentinel';
const REDIS_URL = (process.env.REDIS_URL || '').trim();

function hasValidRedisUrl(url) {
  return /^rediss?:\/\//i.test(url);
}

const redisEnabled = hasValidRedisUrl(REDIS_URL);

let Redis = null;
let redis = null;
if (redisEnabled) {
  Redis = require('ioredis');
  redis = new Redis(REDIS_URL);
  redis.on('error', err => {
    console.error('[jobs] Redis error:', err.message);
  });
} else {
  console.warn('[jobs] Redis disabled. Using in-memory job store.');
}

const memoryJobs = new Map();
const memorySubscribers = new Map();

function getJobKey(id) {
  return `${KEY_PREFIX}:job:${id}`;
}

function getJobEventsChannel(id) {
  return `${KEY_PREFIX}:job-events:${id}`;
}

function snapshotJob(job) {
  if (!job) return null;

  return {
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    result: job.result,
    error: job.error,
  };
}

function getMemorySubscriberSet(id) {
  let set = memorySubscribers.get(id);
  if (!set) {
    set = new Set();
    memorySubscribers.set(id, set);
  }
  return set;
}

async function getJob(id) {
  if (!redisEnabled) {
    return memoryJobs.get(id) ?? null;
  }

  try {
    const raw = await redis.get(getJobKey(id));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[jobs] Failed to get job ${id}:`, err.message);
    return null;
  }
}

async function writeJob(id, job) {
  if (!redisEnabled) {
    memoryJobs.set(id, job);
    return;
  }
  await redis.set(getJobKey(id), JSON.stringify(job), 'EX', JOB_TTL_SECONDS);
}

function publishEvent(id, type, payload, snapshot) {
  if (!redisEnabled) {
    const listeners = memorySubscribers.get(id);
    if (!listeners || listeners.size === 0) return Promise.resolve(0);

    const event = { jobId: id, type, payload, snapshot };
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(`[jobs] In-memory subscriber failed for ${id}:`, err.message);
      }
    }
    return Promise.resolve(listeners.size);
  }

  const event = {
    jobId: id,
    type,
    payload,
    snapshot,
  };

  return redis.publish(getJobEventsChannel(id), JSON.stringify(event)).catch(err => {
    console.error(`[jobs] Failed to publish ${type} for ${id}:`, err.message);
    return 0;
  });
}

function emitJobEvent(id, type, payload = null) {
  return getJob(id).then(job => {
    if (!job) return null;
    return publishEvent(id, type, payload, snapshotJob(job));
  }).catch(err => {
    console.error(`[jobs] emitJobEvent failed for job ${id}:`, err.message);
    return null;
  });
}

async function createJob(id) {
  const job = {
    status: 'running',
    progress: 0,
    stage: 'Starting...',
    result: null,
    error: null,
    createdAt: Date.now(),
  };

  try {
    await writeJob(id, job);
    return job;
  } catch (err) {
    console.error(`[jobs] Failed to create job ${id}:`, err.message);
    return null;
  }
}

function updateJob(id, patch) {
  if (!redisEnabled) {
    const existing = memoryJobs.get(id);
    if (!existing) return Promise.resolve(null);

    const next = { ...existing, ...patch };
    memoryJobs.set(id, next);

    if (next.status === 'running' && (
      patch.progress !== undefined ||
      patch.stage !== undefined ||
      patch.status === 'running'
    )) {
      // Intentionally not awaiting publishEvent so it behaves identically to before
      publishEvent(id, 'progress', {
        status: next.status,
        progress: next.progress,
        stage: next.stage,
      }, snapshotJob(next));
    }

    return Promise.resolve(next);
  }

  // Redis mode - fetch right before write to minimize race
  return getJob(id).then(async existing => {
    if (!existing) return null;

    // Fetch again immediately before writing to shrink the race window
    const currentRaw = await redis.get(getJobKey(id));
    const current = currentRaw ? JSON.parse(currentRaw) : existing;

    const next = { ...current, ...patch };
    await writeJob(id, next);

    if (next.status === 'running' && (
      patch.progress !== undefined ||
      patch.stage !== undefined ||
      patch.status === 'running'
    )) {
      await publishEvent(id, 'progress', {
        status: next.status,
        progress: next.progress,
        stage: next.stage,
      }, snapshotJob(next));
    }

    return next;
  }).catch(err => {
    console.error(`[jobs] Failed to update job ${id}:`, err.message);
    return null;
  });
}

function setJobComplete(id, result) {
  return updateJob(id, {
    status: 'complete',
    progress: 100,
    stage: 'Analysis complete.',
    result,
  }).then(next => {
    if (!next) return null;
    return publishEvent(id, 'complete', { status: 'complete', result }, snapshotJob(next));
  }).catch(err => {
    console.error(`[jobs] Failed to mark complete for ${id}:`, err.message);
    return null;
  });
}

function setJobError(id, message) {
  return updateJob(id, { status: 'error', error: message }).then(next => {
    if (!next) return null;
    return publishEvent(id, 'error', { status: 'error', error: message }, snapshotJob(next));
  }).catch(err => {
    console.error(`[jobs] Failed to mark error for ${id}:`, err.message);
    return null;
  });
}

function subscribeJob(id, listener) {
  if (!redisEnabled) {
    if (!memoryJobs.has(id)) return () => {};
    const set = getMemorySubscriberSet(id);
    set.add(listener);
    return () => {
      const current = memorySubscribers.get(id);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) memorySubscribers.delete(id);
    };
  }

  const subscriber = new Redis(REDIS_URL);
  const channel = getJobEventsChannel(id);
  let subscribed = false;

  subscriber.on('error', err => {
    console.error(`[jobs] Redis subscriber error for ${id}:`, err.message);
  });

  subscriber.on('message', (_channel, message) => {
    try {
      const event = JSON.parse(message);
      listener(event);
    } catch (err) {
      console.error(`[jobs] Invalid event payload for ${id}:`, err.message);
    }
  });

  subscriber.subscribe(channel).then(() => {
    subscribed = true;
  }).catch(err => {
    console.error(`[jobs] Failed to subscribe for ${id}:`, err.message);
  });

  return () => {
    if (!subscribed) {
      subscriber.quit().catch(() => {});
      return;
    }

    subscriber.unsubscribe(channel).catch(() => {}).finally(() => {
      subscriber.quit().catch(() => {});
    });
  };
}

async function getJobsStoreHealth() {
  if (!redisEnabled) {
    return { ok: true, details: 'in-memory mode', mode: 'memory' };
  }

  try {
    const pong = await redis.ping();
    return { ok: pong === 'PONG', details: pong, mode: 'redis' };
  } catch (err) {
    return { ok: false, details: err.message, mode: 'redis' };
  }
}

if (!redisEnabled) {
  setInterval(() => {
    const now = Date.now();
    for (const [id, job] of memoryJobs.entries()) {
      if (now - (job.createdAt || now) > JOB_TTL_MS) {
        memoryJobs.delete(id);
        memorySubscribers.delete(id);
      }
    }
  }, 5 * 60 * 1000);
}

module.exports = {
  createJob,
  getJob,
  updateJob,
  setJobComplete,
  setJobError,
  subscribeJob,
  emitJobEvent,
  snapshotJob,
  getJobsStoreHealth,
  redisEnabled,
};
