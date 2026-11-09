import { randomUUID } from 'crypto';
import { orchestyOptions } from '../Config/Config';
import OnRepeatException from '../Exception/OnRepeatException';
import logger from '../Logger/Logger';
import { CORRELATION_ID, NODE_ID, NODE_NAME, RESULT_CODE, RESULT_MESSAGE, SDK, USER } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';
import ResultCode from '../Utils/ResultCode';
import ActionControlPlaneClient, { IAuditRecord } from './ActionControlPlaneClient';
import {
    ACTION_KINDS,
    ActionError,
    actionKey,
    IActionCatalogItem,
    IActionDefinition,
    IActionRunOptions,
    MAX_ACTION_TIMEOUT,
} from './types';

const AUDIT_MESSAGE_LIMIT = 500;
const SUCCESS_RESULT_CODE: number = ResultCode.SUCCESS;
const RETRYABLE_RESULT_CODES: number[] = [ResultCode.REPEAT, ResultCode.LIMIT_EXCEEDED];

function assertValidDefinition(definition: IActionDefinition): void {
    const key = actionKey(definition);
    if (typeof definition.application !== 'string' || definition.application === '') {
        throw new Error(`Action "${key}" needs a non-empty application.`);
    }
    if (typeof definition.name !== 'string' || definition.name === '') {
        throw new Error(`Action "${key}" needs a non-empty name.`);
    }
    if (!ACTION_KINDS.includes(definition.kind)) {
        throw new Error(`Action "${key}" needs a kind of ${ACTION_KINDS.join(' or ')}, got ${definition.kind}.`);
    }
    const { timeout } = definition;
    if (!Number.isFinite(timeout) || timeout <= 0 || timeout > MAX_ACTION_TIMEOUT) {
        throw new Error(
            `Action "${key}" needs a timeout greater than 0 and at most ${MAX_ACTION_TIMEOUT} s, got ${String(timeout)}.`,
        );
    }
    const connectorApplication = definition.connector.getApplicationName();
    if (connectorApplication !== '' && connectorApplication !== definition.application) {
        throw new Error(
            `Action "${key}" needs a connector of application "${definition.application}", got "${connectorApplication}".`,
        );
    }
}

function assertSuccessResultCode(key: string, dto: ProcessDto): void {
    const code = Number(dto.getHeader(RESULT_CODE, String(SUCCESS_RESULT_CODE)));
    if (code === SUCCESS_RESULT_CODE) {
        return;
    }

    throw new ActionError(
        dto.getHeader(RESULT_MESSAGE) ?? `Action "${key}" ended with result code ${code}.`,
        RETRYABLE_RESULT_CODES.includes(code) ? 503 : 502,
    );
}

function toActionError(e: unknown): ActionError {
    if (e instanceof ActionError) {
        return e;
    }

    return new ActionError(e instanceof Error ? e.message : String(e), e instanceof OnRepeatException ? 503 : 502);
}

export default class ActionRunner {

    private readonly actions = new Map<string, IActionDefinition>();

    public constructor(private readonly controlPlane: ActionControlPlaneClient) {
    }

    public register(definition: IActionDefinition): this {
        assertValidDefinition(definition);
        const key = actionKey(definition);
        if (this.actions.has(key)) {
            throw new Error(`Action "${key}" is already registered.`);
        }
        this.actions.set(key, definition);

        return this;
    }

    public list(): IActionCatalogItem[] {
        return [...this.actions.values()]
            .map((a) => ({
                name: a.name,
                app: a.application,
                kind: a.kind,
                idempotent: a.idempotent,
                description: a.description,
                inputSchema: a.inputSchema,
                timeout: a.timeout,
            }))
            .sort((a, b) => `${a.app}.${a.name}`.localeCompare(`${b.app}.${b.name}`));
    }

    public async run(key: string, input: Record<string, unknown>, options: IActionRunOptions): Promise<unknown> {
        const definition = this.actions.get(key);
        if (!definition) {
            throw new ActionError(`Action "${key}" not found.`, 404);
        }
        if (!options.identity) {
            throw new ActionError('Identity is required.', 400);
        }
        if (!options.sdk) {
            throw new ActionError('SDK is required.', 400);
        }

        const businessKey = this.businessKey(definition, input);
        const grant = await this.controlPlane.grant(key, options.identity);
        if (!grant.allowed) {
            throw new ActionError(`Running action "${key}" is not allowed.`, 403);
        }

        const correlationId = options.correlationId ?? randomUUID();
        const base = {
            action: key,
            identity: options.identity,
            businessKey,
            correlationId,
        };

        if (grant.audit && definition.kind === 'write') {
            try {
                await this.controlPlane.auditNow({ ...base, phase: 'started' });
            } catch (e) {
                throw new ActionError(`Write not started, audit is unavailable: ${(e as Error).message}`, 503);
            }
        }

        const started = Date.now();
        let result: ProcessDto;
        try {
            result = await this.execute(definition, input, options, correlationId);
            assertSuccessResultCode(key, result);
        } catch (e) {
            const error = toActionError(e);
            if (grant.audit) {
                await this.auditOutcome({
                    ...base,
                    phase: 'failed',
                    status: error.status,
                    durationMs: Date.now() - started,
                    message: error.message.slice(0, AUDIT_MESSAGE_LIMIT),
                });
            }
            throw error;
        }

        if (grant.audit) {
            const done: IAuditRecord = {
                ...base,
                phase: definition.kind === 'write' ? 'done' : 'read',
                durationMs: Date.now() - started,
            };
            if (definition.kind === 'write') {
                await this.auditOutcome(done);
            } else {
                this.controlPlane.auditLater(done);
            }
        }

        return this.parseResult(key, result);
    }

    private businessKey(definition: IActionDefinition, input: Record<string, unknown>): string | undefined {
        try {
            return definition.businessKey?.(input);
        } catch (e) {
            throw new ActionError(
                `Business key of action "${actionKey(definition)}" failed: ${(e as Error).message}`,
                400,
            );
        }
    }

    private async auditOutcome(record: IAuditRecord): Promise<void> {
        try {
            await this.controlPlane.auditNow(record);
        } catch (e) {
            logger.error(
                `Action audit lost (${record.phase} ${record.action}, correlation ${String(record.correlationId)}): ${(e as Error).message}`,
                {},
            );
        }
    }

    private parseResult(key: string, result: ProcessDto): unknown {
        try {
            return result.getJsonData();
        } catch {
            throw new ActionError(`Action "${key}" returned a non-JSON result.`, 502);
        }
    }

    private async execute(
        definition: IActionDefinition,
        input: Record<string, unknown>,
        options: IActionRunOptions,
        correlationId: string,
    ): Promise<ProcessDto> {
        const key = actionKey(definition);
        const dto = new ProcessDto()
            .setJsonData(input)
            .addHeader(USER, orchestyOptions.systemUser)
            .addHeader(SDK, options.sdk)
            .addHeader(NODE_ID, `action:${key}`)
            .addHeader(NODE_NAME, `action:${key}`)
            .addHeader(CORRELATION_ID, correlationId)
            .setCurrentApp(definition.application);
        if (options.idempotencyKey) {
            dto.addHeader('idempotency-key', options.idempotencyKey);
        }

        let timer: NodeJS.Timeout | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(new ActionError(`Action "${key}" timed out after ${definition.timeout} s.`, 504)),
                definition.timeout * 1000,
            );
        });

        try {
            return await Promise.race([definition.connector.processAction(dto), timeout]);
        } finally {
            clearTimeout(timer);
        }
    }

}
