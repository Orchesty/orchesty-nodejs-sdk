import AProcessDto, { AuditData, AuditDataField } from './AProcessDto';
import { AUDIT_ENTITY, BATCH_CURSOR, IHttpHeaders, LIMITER_KEY, parseLimitKey } from './Headers';
import ResultCode from './ResultCode';

export interface IBatchMessage {
    body: string; // Is string to support XML fe.
    headers: Record<string, string[] | string> | null;
}

export default class BatchProcessDto<Data = unknown, Item = unknown> extends AProcessDto<Data> {

    private messages: IBatchMessage[];

    public constructor(commonHeaders: IHttpHeaders = {}) {
        super();
        this.messages = [];
        this.headers = commonHeaders;
    }

    public getMessages(): IBatchMessage[] {
        return this.messages;
    }

    public setMessages(messages: IBatchMessage[]): this {
        this.messages = messages;

        return this;
    }

    public addItem(
        body: Item,
        user?: string,
        limit?: string,
        headers?: Record<string, string[] | string> | null,
    ): BatchProcessDto<Item> {
        let b: unknown = body;
        if (typeof body !== 'string') {
            b = JSON.stringify(body);
        }

        const limits = parseLimitKey(this.headers?.[LIMITER_KEY] as string);
        if (limit) {
            limits[limit.split(';')[0]] = limit;
        }

        this.messages.push({
            headers: {
                ...limit ? { [LIMITER_KEY]: Object.values(limits).join(';') } : null,
                ...user ? { user } : null,
                ...headers ?? null,
            },
            body: b as string,
        });

        return this as unknown as BatchProcessDto<Item>;
    }

    /**
     * Adds a single batch item together with its own per-item `audit-entity` header.
     *
     * Use this in batch connectors instead of the combination
     *   `dto.addItem(o)` + `dto.addAuditHeader(...)` on the batch DTO.
     *
     * Why: when the bridge splits a batch DTO, it copies the parent headers to every
     * child message via `CopyBatchItem`. If the parent's `audit-entity` carries all N
     * entities, every child carries N mappings even though it represents only one
     * item, breaking per-entity Trace granularity. With per-item `audit-entity` set
     * via this helper, each child only references the entity that actually lives in
     * its body.
     *
     * Two overloads are provided:
     *  - The single-entity convenience overload (`entity, key, fields`) is the common
     *    case and matches the shape of `AProcessDto.addAuditHeader(...)`.
     *  - The multi-entity overload accepts an `AuditData` map keyed by entity name
     *    for items that legitimately and authoritatively touch more than one entity.
     *
     * The helper ALWAYS merges the requested entries with the dto's existing
     * `audit-entity` header (`this.getHeader(AUDIT_ENTITY)`). This matters for
     * batches that sit in the middle of a chain: the parent split has already set a
     * per-item `audit-entity` (propagated via `CopyBatchItem`), and we want to keep
     * those parent entities intact while augmenting them. On conflict the supplied
     * entry replaces the existing one for that entity name (last write wins).
     *
     * Examples:
     *   // Single-entity (common case)
     *   ORDERS.forEach((o) => dto.addItemWithAudit(
     *       o, 'order', 'id', [{ id: o.id, trackingId: o.trackingId }],
     *   ));
     *
     *   // Multi-entity (rare, when the item authoritatively touches several)
     *   dto.addItemWithAudit(payload, {
     *       order:   { key: 'id', fields: [{ id: '1' }] },
     *       invoice: { key: 'id', fields: [{ id: 'A' }] },
     *   });
     */
    public addItemWithAudit<T extends string>(
        body: Item,
        entity: string,
        key: T,
        fields: AuditDataField<T>[],
        user?: string,
        limit?: string,
    ): BatchProcessDto<Item>;

    public addItemWithAudit(
        body: Item,
        audits: AuditData,
        user?: string,
        limit?: string,
    ): BatchProcessDto<Item>;

    public addItemWithAudit<T extends string>(
        body: Item,
        entityOrAudits: unknown,
        keyOrUser?: unknown,
        fieldsOrLimit?: unknown,
        userArg?: unknown,
        limitArg?: unknown,
    ): BatchProcessDto<Item> {
        const merged = JSON.parse(this.getHeader(AUDIT_ENTITY, '{}')) as AuditData;
        let user: string | undefined;
        let limit: string | undefined;

        if (typeof entityOrAudits === 'object' && entityOrAudits !== null) {
            Object.assign(merged, entityOrAudits as AuditData);
            user = typeof keyOrUser === 'string' ? keyOrUser : undefined;
            limit = typeof fieldsOrLimit === 'string' ? fieldsOrLimit : undefined;
        } else {
            merged[entityOrAudits as string] = {
                key: keyOrUser as T,
                fields: fieldsOrLimit as AuditDataField<T>[],
            };
            user = typeof userArg === 'string' ? userArg : undefined;
            limit = typeof limitArg === 'string' ? limitArg : undefined;
        }

        return this.addItem(body, user, limit, { [AUDIT_ENTITY]: JSON.stringify(merged) });
    }

    public setItemList(list: Item[], asBatch = false): BatchProcessDto<Item[]> {
        if (asBatch) {
            this.addItem([list] as Item);
        } else {
            list.forEach((it) => {
                this.addItem(it);
            });
        }

        return this as unknown as BatchProcessDto<Item[]>;
    }

    public addMessage(message: IBatchMessage): this {
        this.messages.push(message);

        return this;
    }

    public setBatchCursor(cursor: string, iterateOnly = false): this {
        this.addHeader(BATCH_CURSOR, cursor);
        if (iterateOnly) {
            this.setStatusHeader(
                ResultCode.BATCH_CURSOR_ONLY,
                `Message will be used as a iterator with cursor [${cursor}]. No follower will be called.`,
            );
        } else {
            this.setStatusHeader(
                ResultCode.BATCH_CURSOR_WITH_FOLLOWERS,
                `Message will be used as a iterator with cursor [${cursor}]. Data will be send to follower(s).`,
            );
        }

        return this;
    }

    public getBatchCursor(defaultValue = ''): string {
        return this.getHeader(BATCH_CURSOR, defaultValue);
    }

    public removeBatchCursor(): this {
        this.removeHeader(BATCH_CURSOR);
        this.removeRelatedHeaders([ResultCode.BATCH_CURSOR_ONLY, ResultCode.BATCH_CURSOR_WITH_FOLLOWERS]);

        return this;
    }

    public setBridgeData(data: string): this {
        this.data = data;

        return this;
    }

    public getBridgeData(): unknown {
        return JSON.stringify(this.messages);
    }

    protected clearData(): this {
        this.messages = [];

        return this;
    }

}
