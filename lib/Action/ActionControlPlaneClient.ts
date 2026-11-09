import logger from '../Logger/Logger';
import { ORCHESTY_API_KEY } from '../Utils/Headers';
import { ActionError, IGrant } from './types';

const READ_AUDIT_FLUSH_MS = 2000;
const READ_AUDIT_BATCH = 50;
export const GRANT_CACHE_MAX = 10000;

export interface IAuditRecord {
    action: string;
    identity: string;
    phase: 'done' | 'failed' | 'read' | 'started';
    businessKey?: string;
    correlationId?: string;
    durationMs?: number;
    message?: string;
    status?: number;
}

/* eslint-disable @typescript-eslint/naming-convention */
function toWire(record: IAuditRecord): Record<string, unknown> {
    return {
        action: record.action,
        identity: record.identity,
        phase: record.phase,
        business_key: record.businessKey,
        correlation_id: record.correlationId,
        duration_ms: record.durationMs,
        message: record.message,
        status: record.status,
    };
}
/* eslint-enable @typescript-eslint/naming-convention */

export default class ActionControlPlaneClient {

    private readonly grants = new Map<string, IGrant>();

    private readonly readAudit: IAuditRecord[] = [];

    private flushTimer?: NodeJS.Timeout;

    public constructor(private readonly backendUrl: string, private readonly apiKey: string) {
    }

    public async grant(action: string, identity: string): Promise<IGrant> {
        const cacheKey = `${identity}|${action}`;
        const cached = this.grants.get(cacheKey);
        if (cached) {
            if (cached.expiresAt > Date.now()) {
                return cached;
            }
            this.grants.delete(cacheKey);
        }

        const response = await this.post('/api/actions/grant', { action, identity }).catch((e: unknown) => {
            throw new ActionError(`Action grant is unavailable: ${(e as Error).message}`, 503);
        });
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (!response.ok) {
            throw new ActionError(String(body.message ?? `Grant refused (${response.status})`), response.status);
        }
        if (body.allowed !== true) {
            throw new ActionError(`Invalid grant response (${response.status}).`, 502);
        }

        const grant: IGrant = {
            allowed: true,
            audit: body.audit === true,
            expiresAt: Date.now() + (Number(body.expires_in ?? 60) * 1000),
        };
        this.cacheGrant(cacheKey, grant);

        return grant;
    }

    public async auditNow(record: IAuditRecord): Promise<void> {
        const response = await this.post('/api/actions/audit', { records: [toWire(record)] });
        if (!response.ok) {
            throw new Error(`Audit refused (${response.status})`);
        }
    }

    public auditLater(record: IAuditRecord): void {
        this.readAudit.push(record);
        if (this.readAudit.length >= READ_AUDIT_BATCH) {
            this.flush().catch(() => undefined);
        } else {
            this.flushTimer ??= setTimeout(() => {
                this.flush().catch(() => undefined);
            }, READ_AUDIT_FLUSH_MS);
        }
    }

    public async flush(): Promise<void> {
        clearTimeout(this.flushTimer);
        this.flushTimer = undefined;
        const records = this.readAudit.splice(0, this.readAudit.length);
        if (!records.length) {
            return;
        }

        try {
            const response = await this.post('/api/actions/audit', { records: records.map(toWire) });
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
        } catch (e) {
            logger.error(`Action read audit lost (${records.length} records): ${(e as Error).message}`, {});
        }
    }

    private cacheGrant(cacheKey: string, grant: IGrant): void {
        if (this.grants.size >= GRANT_CACHE_MAX) {
            const now = Date.now();
            this.grants.forEach((cached, key) => {
                if (cached.expiresAt <= now) {
                    this.grants.delete(key);
                }
            });
            for (const key of this.grants.keys()) {
                if (this.grants.size < GRANT_CACHE_MAX) {
                    break;
                }
                this.grants.delete(key);
            }
        }
        this.grants.set(cacheKey, grant);
    }

    private async post(path: string, body: unknown): Promise<Response> {
        return fetch(`${this.backendUrl.replace(/\/+$/, '')}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', [ORCHESTY_API_KEY]: this.apiKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000),
        });
    }

}
