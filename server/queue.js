'use strict';

const QUEUE_NAME = 'visual-sentinel-analysis';
const REDIS_URL = (process.env.REDIS_URL || '').trim();

function hasValidRedisUrl(url) {
  return /^rediss?:\/\//i.test(url);
}

const queueEnabled = hasValidRedisUrl(REDIS_URL);

let Queue = null;
let Redis = null;
let queue = null;

if (queueEnabled) {
  ({ Queue } = require('bullmq'));
  Redis = require('ioredis');
  queue = new Queue(QUEUE_NAME, {
    connection: REDIS_URL,
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 200,
      attempts: 1,
    },
  });
} else {
  console.warn('[queue] Redis queue disabled. Using inline analysis mode.');
}

async function enqueueAnalysis(jobId, url) {
  if (!queueEnabled || !queue) {
    return { id: jobId, name: 'inline', data: { jobId, url } };
  }
  return queue.add('analyze-url', { jobId, url }, { jobId });
}

async function getQueueHealth() {
  if (!queueEnabled) {
    return { ok: true, details: 'inline mode', mode: 'inline' };
  }

  try {
    const client = new Redis(REDIS_URL);
    const ping = await client.ping();
    await client.quit();
    return { ok: ping === 'PONG', details: ping, mode: 'redis' };
  } catch (err) {
    return { ok: false, details: err.message, mode: 'redis' };
  }
}

module.exports = {
  QUEUE_NAME,
  queue,
  enqueueAnalysis,
  getQueueHealth,
  queueEnabled,
};
