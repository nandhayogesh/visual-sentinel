/**
 * analyzer.ts — Real API client
 * Communicates with the Node.js backend.
 *
 * Dev:  VITE_API_URL is unset → Vite proxy handles /api/* → localhost:3001
 * Prod: VITE_API_URL = https://your-railway-backend.up.railway.app
 */

import type { AnalysisResult, AnalysisProgress, AnalysisError, AnalysisResponse } from '@/types/analysis';

export type { AnalysisResult, AnalysisProgress, AnalysisError, AnalysisResponse };

export interface AnalysisStreamHandlers {
  onSnapshot?: (snapshot: AnalysisResponse) => void;
  onProgress?: (progress: AnalysisProgress & {
    checkName?: string;
    check?: unknown;
    checkProgress?: unknown;
    completedChecks?: number;
    totalChecks?: number;
    status?: string;
    partialChecks?: Record<string, unknown>;
  }) => void;
  onComplete?: (result: AnalysisResult) => void;
  onError?: (error: AnalysisError) => void;
  onTransportError?: (error: Error) => void;
}

export interface AnalysisStreamConnection {
  close: () => void;
  source: EventSource;
}

// In development the Vite proxy forwards /api/* to localhost:3001.
// In production set VITE_API_URL to your Railway/Render backend URL.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

function parseEventData<T>(event: MessageEvent<string>): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function buildApiPath(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Submit a URL for analysis.
 * Returns a jobId that can be polled with `pollAnalysis`.
 */
export async function submitAnalysis(url: string): Promise<string> {
  const res = await fetch(buildApiPath('/api/analyze'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `Server error: ${res.status}`);
  }

  const data = await res.json() as { jobId: string };
  return data.jobId;
}

/**
 * Poll the status of an ongoing analysis.
 * Returns: running progress, complete result, or error.
 */
export async function pollAnalysis(jobId: string): Promise<AnalysisResponse> {
  const res = await fetch(buildApiPath(`/api/status/${jobId}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `Status check failed: ${res.status}`);
  }
  return res.json() as Promise<AnalysisResponse>;
}

/**
 * Check backend health — useful to detect missing API keys on startup.
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  keys: { urlscan: boolean; virustotal: boolean; safebrowsing: boolean };
} | null> {
  try {
    const res = await fetch(buildApiPath('/api/health'));
    return res.json();
  } catch {
    return null;
  }
}

export function subscribeAnalysis(jobId: string, handlers: AnalysisStreamHandlers): AnalysisStreamConnection | null {
  if (typeof EventSource === 'undefined') {
    return null;
  }

  const source = new EventSource(buildApiPath(`/api/stream/${jobId}`));

  source.addEventListener('snapshot', event => {
    const snapshot = parseEventData<AnalysisResponse>(event as MessageEvent<string>);
    if (snapshot) {
      handlers.onSnapshot?.(snapshot);
    }
  });

  source.addEventListener('progress', event => {
    const progress = parseEventData<AnalysisStreamHandlers['onProgress'] extends (arg: infer T) => void ? T : never>(event as MessageEvent<string>);
    if (progress) {
      handlers.onProgress?.(progress);
    }
  });

  source.addEventListener('complete', event => {
    const payload = parseEventData<{ status?: string; result?: AnalysisResult }>(event as MessageEvent<string>);
    if (payload?.result) {
      handlers.onComplete?.(payload.result);
    }
  });

  source.addEventListener('error', event => {
    const payload = parseEventData<{ status?: string; error?: string }>(event as MessageEvent<string>);
    if (payload?.error) {
      handlers.onError?.({ status: 'error', error: payload.error });
      return;
    }

    handlers.onTransportError?.(new Error('SSE stream disconnected'));
  });

  return {
    source,
    close: () => source.close(),
  };
}

// ─── Legacy helpers (kept to avoid breaking other files) ────────────────────
export function parseDomain(url: string): string {
  try {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return url.toLowerCase().split('/')[0];
  }
}

export function getBrandDatabase() {
  return [];
}
