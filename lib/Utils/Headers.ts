// Framework headers
import util from 'util';

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
export const APPLICATIONS = 'applications';
export const ORCHESTY_API_KEY = 'orchesty-api-key';

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

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface IHttpHeaders {
    [key: string]: string[] | string | undefined;
}

export enum CommonHeaders {
    CONTENT_TYPE = 'Content-Type',
    ACCEPT = 'Accept',
    ACCEPT_ENCODING = 'Accept-Encoding',
    AUTHORIZATION = 'Authorization',
    COOKIE = 'Cookie',
}

export const JSON_TYPE = 'application/json';

export function get(key: string, headers: IHttpHeaders): string | undefined {
    if (headers[key]) {
        return String(headers[key]);
    }

    return undefined;
}

export function getCorrelationId(headers: IHttpHeaders): string | undefined {
    return get(CORRELATION_ID, headers);
}

export function getTopologyId(headers: IHttpHeaders): string | undefined {
    return get(TOPOLOGY_ID, headers);
}

export function getNodeId(headers: IHttpHeaders): string | undefined {
    return get(NODE_ID, headers);
}

export function getProcessId(headers: IHttpHeaders): string | undefined {
    return get(PROCESS_ID, headers);
}

export function getParentId(headers: IHttpHeaders): string | undefined {
    return get(PARENT_ID, headers);
}

export function getSequenceId(headers: IHttpHeaders): number {
    return parseInt(get(SEQUENCE_ID, headers) ?? '0', 10);
}

export function getUserId(headers: IHttpHeaders): string {
    return get(USER, headers) ?? '0';
}

export function getRepeatHops(headers: IHttpHeaders): number {
    return parseInt(get(REPEAT_HOPS, headers) ?? '0', 10);
}

export function getRepeaterMaxHops(headers: IHttpHeaders): number {
    return parseInt(get(REPEAT_MAX_HOPS, headers) ?? '0', 10);
}

export function decorateLimitKey(key: string): string {
    let newKey = key;
    if (!key.includes('|')) {
        newKey = util.format('%s|', key);
    }

    return newKey;
}

export function parseLimitKey(limitKey?: string): Record<string, string> {
    if (!limitKey) {
        return {};
    }
    const split = limitKey.split(';');
    const parsedLimits: Record<string, string> = {};
    for (let i = 0; i < split.length; i += 3) {
        parsedLimits[split[i]] = `${split[i]};${split[i + 1]};${split[i + 2]}`;
    }
    return parsedLimits;
}

export function getLimiterKey(key: string, time: number, amount: number): string {
    return util.format('%s;%s;%s', decorateLimitKey(key), time, amount);
}

export function getLimiterKeyWithGroup(
    key: string,
    time: number,
    amount: number,
    groupKey: string,
    groupTime: number,
    groupAmount: number,
): string {
    return util.format(
        '%s;%s;%s;%s;%s;%s',
        decorateLimitKey(key),
        time,
        amount,
        decorateLimitKey(groupKey),
        groupTime,
        groupAmount,
    );
}
