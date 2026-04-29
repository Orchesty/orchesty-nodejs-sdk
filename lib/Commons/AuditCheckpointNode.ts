import ProcessDto from '../Utils/ProcessDto';
import ACommonNode from './ACommonNode';
import { IAuditCheckpoint } from './IAuditCheckpoint';

/**
 * Pure passthrough node whose only purpose is to mark a business audit
 * checkpoint in a topology. Subclasses MUST implement {@link getAuditCheckpoint}
 * to declare what is being audited (role, optional entityPath, REQUIRED fields
 * allowlist).
 *
 * **PREFER overriding `getAuditCheckpoint()` directly on the boundary
 * connector** for `process_entry` / `process_exit` audit. A passthrough placed
 * BEFORE an output connector cannot know whether the downstream delivery
 * succeeded — the audit log it emits will always say "success" regardless of
 * the actual outcome. Putting the audit declaration on the connector itself
 * makes the bridge emit the log AFTER `processAction` returns, capturing the
 * real `resultCode/resultStatus/resultMessage` from the delivery attempt.
 *
 * Legitimate use cases for this passthrough node:
 * - `process_step` markers in the middle of a business chain.
 * - Boundary nodes that are NOT `AConnector` (e.g. webhook custom node) and
 *   you want to keep audit declaration outside the business code.
 * - Per-entity audit AFTER a batch fan-out (the batch connector's own
 *   getAuditCheckpoint() fires once per batch with an array payload; if you
 *   need one log line per child, place this node after the split).
 *
 * Use as a normal "Custom Node" in the editor — no new node type is needed.
 *
 * The Bridge picks up the `audit-checkpoint` response header (set by the SDK
 * Router) and emits a structured INFO log to Loki containing the picked subset
 * of the request body. The data flowing through the node is left intact.
 */
export default abstract class AuditCheckpointNode extends ACommonNode {

    public abstract getAuditCheckpoint(): IAuditCheckpoint;

    public processAction(dto: ProcessDto): ProcessDto {
        return dto;
    }

}
