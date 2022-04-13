// Framework prefix
const PREFIX = 'pf-';

// Framework headers
export const PREV_CORRELATION_ID = 'previous-correlation-id';
export const CORRELATION_ID = 'correlation-id';
export const PROCESS_ID = 'process-id';
export const PARENT_ID = 'parent-id';
export const SEQUENCE_ID = 'sequence-id';
export const PREV_NODE_ID = 'previous-node-id';
export const NODE_ID = 'node-id';
export const NODE_NAME = 'node-name';
export const TOPOLOGY_ID = 'topology-id';
export const TOPOLOGY_NAME = 'topology-name';
export const APPLICATION = 'application';
export const USER = 'user';
export const WORKER_FOLLOWERS = 'worker-followers';
export const FORCE_TARGET_QUEUE = 'force-target-queue';

// Result headers
export const RESULT_CODE = 'result-code';
export const RESULT_MESSAGE = 'result-message';
export const RESULT_DETAIL = 'result-detail';

// Repeater headers
export const REPEAT_QUEUE = 'repeat-queue';
export const REPEAT_INTERVAL = 'repeat-interval';
export const REPEAT_MAX_HOPS = 'repeat-max-hops';
export const REPEAT_HOPS = 'repeat-hops';

// Limiter headers
export const LIMITER_KEY = 'limiter-key';

// Batch headers
export const BATCH_CURSOR = 'cursor';

const WHITE_LIST = ['content-type'];

export type HttpHeaders = NodeJS.Dict<string | string[]>

export enum CommonHeaders {
  CONTENT_TYPE = 'Content-Type',
  ACCEPT = 'Accept',
  AUTHORIZATION = 'Authorization',
}

export const JSON_TYPE = 'application/json';

function existPrefix(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function createKey(key: string): string {
  return `${PREFIX}${key}`.toLowerCase();
}

export function get(key: string, headers: HttpHeaders): string | undefined {
  if (headers[createKey(key)]) {
    return String(headers[createKey(key)]);
  }

  return undefined;
}

export function clear(headers: HttpHeaders): HttpHeaders {
  const res: HttpHeaders = {};
  Object.entries(headers).forEach(
    ([key, value]) => {
      if (WHITE_LIST.includes(key.toLowerCase()) || existPrefix(key.toLowerCase())) {
        res[key] = value;
      }
    },
  );
  return res;
}

export function getCorrelationId(headers: HttpHeaders): string | undefined {
  return get(CORRELATION_ID, headers);
}

export function getTopologyId(headers: HttpHeaders): string | undefined {
  return get(TOPOLOGY_ID, headers);
}

export function getNodeId(headers: HttpHeaders): string | undefined {
  return get(NODE_ID, headers);
}

export function getProcessId(headers: HttpHeaders): string | undefined {
  return get(PROCESS_ID, headers);
}

export function getParentId(headers: HttpHeaders): string | undefined {
  return get(PARENT_ID, headers);
}

export function getSequenceId(headers: HttpHeaders): number {
  return parseInt(get(SEQUENCE_ID, headers) || '0', 10);
}

export function getRepeatHops(headers: HttpHeaders): number {
  return parseInt(get(REPEAT_HOPS, headers) || '0', 10);
}

export function getRepeaterMaxHops(headers: HttpHeaders): number {
  return parseInt(get(REPEAT_MAX_HOPS, headers) || '0', 10);
}
