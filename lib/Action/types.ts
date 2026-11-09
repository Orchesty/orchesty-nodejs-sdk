import AConnector from '../Connector/AConnector';

export type ActionKind = 'read' | 'write';

export const ACTION_KINDS: readonly ActionKind[] = ['read', 'write'];

export const MCP_CALL_TIMEOUT = 25;

export const MAX_ACTION_TIMEOUT = MCP_CALL_TIMEOUT - 5;

export interface IActionDefinition {
    name: string;
    application: string;
    kind: ActionKind;
    idempotent: boolean;
    description: string;
    inputSchema: Record<string, unknown>;
    timeout: number;
    connector: AConnector;
    businessKey?(input: Record<string, unknown>): string | undefined;
}

export interface IActionCatalogItem {
    name: string;
    app: string;
    kind: ActionKind;
    idempotent: boolean;
    description: string;
    inputSchema: Record<string, unknown>;
    timeout: number;
}

export interface IActionRunOptions {
    identity: string;
    sdk: string;
    idempotencyKey?: string;
    correlationId?: string;
}

export interface IGrant {
    allowed: boolean;
    audit: boolean;
    expiresAt: number;
}

export class ActionError extends Error {

    public constructor(message: string, public readonly status: number) {
        super(message);
    }

}

export function actionKey(definition: Pick<IActionDefinition, 'application' | 'name'>): string {
    return `${definition.application}.${definition.name}`;
}
