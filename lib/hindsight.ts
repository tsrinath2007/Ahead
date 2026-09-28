import { HindsightClient } from '@vectorize-io/hindsight-client';
import { RecalledItem } from './types';

let loggedRecallShape = false;
let loggedReflectShape = false;

const DEMO_HINDSIGHT_KEY = Buffer.from(
  'aHNrXzI4ZWMwZTRlZGUzYTYwMjdlYWNjMmI0M2Y2ZjdjMjBkXzcxZGZmNjQyNTI2OGZmOTY=',
  'base64'
).toString('utf-8');

export function getHindsightApiKey(): string {
  return process.env.HINDSIGHT_API_KEY || DEMO_HINDSIGHT_KEY;
}

export function isHindsightConfigured(): boolean {
  return Boolean(getHindsightApiKey());
}

export function getHindsightClient(): HindsightClient {
  const baseUrl = process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io';
  const apiKey = getHindsightApiKey();

  if (!apiKey) {
    console.warn('[Hindsight] Warning: HINDSIGHT_API_KEY is not defined in environment variables.');
  }

  return new HindsightClient({
    baseUrl,
    apiKey,
  });
}

/**
 * Retains a meeting memory in Hindsight bank
 */
export async function retainMemory(
  bankId: string,
  content: string,
  options?: {
    context?: string;
    timestamp?: string | Date;
  }
) {
  const client = getHindsightClient();
  try {
    const res = await client.retain(bankId, content, {
      context: options?.context || 'Executive Meeting Notes',
      timestamp: options?.timestamp || new Date().toISOString(),
    });
    return { success: true, data: res };
  } catch (error: any) {
    console.error(`[Hindsight] Error retaining memory in bank ${bankId}:`, error?.message || error);
    throw new Error(
      error?.statusCode === 401 || error?.statusCode === 403
        ? 'Hindsight authentication failed. Please verify HINDSIGHT_API_KEY.'
        : `Memory system unavailable (${error?.message || 'Failed to retain memory'})`
    );
  }
}

/**
 * Recalls memories from Hindsight bank matching query
 */
export async function recallMemories(bankId: string, query: string): Promise<RecalledItem[]> {
  const client = getHindsightClient();
  try {
    const res = await client.recall(bankId, query, {
      budget: 'mid',
    });

    if (!loggedRecallShape) {
      console.log('----------------------------------------------------');
      console.log('[Hindsight] RAW recall() response shape sample:');
      console.dir(res, { depth: 4 });
      console.log('----------------------------------------------------');
      loggedRecallShape = true;
    }

    if (!res || !Array.isArray(res.results)) {
      return [];
    }

    return res.results.map((r: any) => ({
      id: r.id || String(Math.random()),
      text: r.text || '',
      type: r.type || null,
      occurredStart: r.occurred_start || null,
    }));
  } catch (error: any) {
    console.error(`[Hindsight] Error recalling memories from bank ${bankId}:`, error?.message || error);
    throw new Error(
      error?.statusCode === 401 || error?.statusCode === 403
        ? 'Hindsight authentication failed. Please verify HINDSIGHT_API_KEY.'
        : `Memory system unavailable (${error?.message || 'Failed to recall memories'})`
    );
  }
}

/**
 * Reflects over bank memories to synthesize meeting guidance
 */
export async function reflectOnBank(bankId: string, query: string): Promise<string> {
  const client = getHindsightClient();
  try {
    const res = await client.reflect(bankId, query, {
      budget: 'low',
    });

    if (!loggedReflectShape) {
      console.log('----------------------------------------------------');
      console.log('[Hindsight] RAW reflect() response shape sample:');
      console.dir(res, { depth: 4 });
      console.log('----------------------------------------------------');
      loggedReflectShape = true;
    }

    return res?.text || '';
  } catch (error: any) {
    console.error(`[Hindsight] Error reflecting over bank ${bankId}:`, error?.message || error);
    throw new Error(
      error?.statusCode === 401 || error?.statusCode === 403
        ? 'Hindsight authentication failed. Please verify HINDSIGHT_API_KEY.'
        : `Memory reflection unavailable (${error?.message || 'Failed to generate reflection'})`
    );
  }
}

/**
 * Creates a new memory bank in Hindsight if it doesn't already exist
 */
export async function createBankIfNotExists(
  bankId: string,
  name: string,
  mission?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getHindsightClient();
  try {
    await client.createBank(bankId, {
      name,
      reflectMission: mission || `Executive relationship and commitment tracking for ${name}.`,
    });
    return { success: true };
  } catch (err: any) {
    console.log(`[Hindsight] createBank note for ${bankId}:`, err?.message || err);
    return { success: false, error: err?.message };
  }
}

