import AuditCheckpointRoleEnum from './AuditCheckpointRoleEnum';

/**
 * Declarative spec describing a business audit checkpoint emitted by a node.
 *
 * The spec is serialized into the `audit-checkpoint` HTTP response header by the
 * SDK Router and parsed/emitted as a structured INFO log by the Bridge.
 *
 * Security model:
 * - `fields` is a REQUIRED allowlist. There is no wildcard support — if you want
 *   to audit every field of an entity, list them explicitly. This forces the
 *   developer to make a conscious decision about what data leaves the boundary
 *   into the log aggregator.
 * - `fields: []` is explicitly valid and means "marker only" — no payload is
 *   logged, only the timestamp + correlationId + role + nodeName. Use for very
 *   sensitive entities (card data, credentials) where the mere fact that the
 *   entity flowed through this point is the audit signal.
 */
export interface IAuditCheckpoint {
    role: AuditCheckpointRoleEnum;
    /** REQUIRED allowlist of fields to extract from the entity. `[]` = marker only. */
    fields: string[];
    /** Dot-path to the entity inside the request body. Defaults to `$` (root). */
    entityPath?: string;
}
