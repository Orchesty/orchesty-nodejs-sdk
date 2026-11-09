/* eslint-disable max-classes-per-file */
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import AConnector from '../../Connector/AConnector';
import OnRepeatException from '../../Exception/OnRepeatException';
import logger from '../../Logger/Logger';
import ProcessDto from '../../Utils/ProcessDto';
import ResultCode from '../../Utils/ResultCode';
import ActionControlPlaneClient, { IAuditRecord } from '../ActionControlPlaneClient';
import ActionRunner from '../ActionRunner';
import { ActionError, ActionKind, IActionDefinition, IGrant, MAX_ACTION_TIMEOUT } from '../types';

class EchoConnector extends AConnector {

    public calls = 0;

    public lastHeaders: Record<string, unknown> = {};

    public getName(): string {
        return 'echo';
    }

    public async processAction(dto: ProcessDto): Promise<ProcessDto> {
        this.calls += 1;
        this.lastHeaders = dto.getHeaders();

        return Promise.resolve(dto.setJsonData({ echo: dto.getJsonData() }));
    }

}

class XmlConnector extends AConnector {

    public calls = 0;

    public getName(): string {
        return 'xml';
    }

    public processAction(dto: ProcessDto): ProcessDto {
        this.calls += 1;

        return dto.setData('<ok/>');
    }

}

class BrokenConnector extends AConnector {

    public constructor(private readonly error: Error = new Error('target system down')) {
        super();
    }

    public getName(): string {
        return 'broken';
    }

    public async processAction(): Promise<ProcessDto> {
        return Promise.reject(this.error);
    }

}

class MarkingConnector extends AConnector {

    public calls = 0;

    public constructor(private readonly mark: (dto: ProcessDto) => ProcessDto) {
        super();
    }

    public getName(): string {
        return 'marking';
    }

    public processAction(dto: ProcessDto): ProcessDto {
        this.calls += 1;

        return this.mark(dto);
    }

}

class FakeControlPlane extends ActionControlPlaneClient {

    public written: IAuditRecord[] = [];

    public read: IAuditRecord[] = [];

    public constructor(
        private readonly grantResult: Error | IGrant,
        private readonly failingPhases: IAuditRecord['phase'][] = [],
    ) {
        super('http://backend', 'key');
    }

    public async grant(): Promise<IGrant> {
        if (this.grantResult instanceof Error) {
            return Promise.reject(this.grantResult);
        }

        return Promise.resolve(this.grantResult);
    }

    public async auditNow(record: IAuditRecord): Promise<void> {
        if (this.failingPhases.includes(record.phase)) {
            return Promise.reject(new Error('backend down'));
        }
        this.written.push(record);

        return Promise.resolve();
    }

    public auditLater(record: IAuditRecord): void {
        this.read.push(record);
    }

}

function definition(connector: AConnector, kind: 'read' | 'write'): IActionDefinition {
    return {
        name: 'echo',
        application: 'demo',
        kind,
        idempotent: false,
        description: '',
        inputSchema: {},
        timeout: 5,
        connector,
        businessKey: (input) => String(input.id),
    };
}

const auditedGrant: IGrant = { allowed: true, audit: true, expiresAt: Date.now() + 60_000 };
const options = { identity: 'u@x.io', sdk: 'node-sdk' };

describe('ActionRunner', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('records write intent and outcome around the call', async () => {
        const connector = new EchoConnector();
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'write'));

        const result = await runner.run('demo.echo', { id: 7 }, { ...options, idempotencyKey: 'k1' });

        expect(result).toEqual({ echo: { id: 7 } });
        expect(controlPlane.written.map((r) => r.phase)).toEqual(['started', 'done']);
        expect(controlPlane.written[0].businessKey).toBe('7');
        expect(connector.lastHeaders['node-id']).toBe('action:demo.echo');
        expect(connector.lastHeaders['idempotency-key']).toBe('k1');
        expect(connector.lastHeaders.sdk).toBe('node-sdk');
    });

    it('refuses a run without the SDK name', async () => {
        const connector = new EchoConnector();
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant)).register(definition(connector, 'read'));

        await expect(runner.run('demo.echo', {}, { identity: 'u@x.io', sdk: '' })).rejects.toMatchObject({ status: 400 });
        expect(connector.calls).toBe(0);
    });

    it('does not call the target system when the write intent cannot be recorded', async () => {
        const connector = new EchoConnector();
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant, ['started']))
            .register(definition(connector, 'write'));

        await expect(runner.run('demo.echo', { id: 7 }, options)).rejects.toMatchObject({ status: 503 });
        expect(connector.calls).toBe(0);
    });

    it('audits reads in the background', async () => {
        const connector = new EchoConnector();
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'read'));

        await runner.run('demo.echo', { id: 1 }, options);

        expect(controlPlane.written).toEqual([]);
        expect(controlPlane.read.map((r) => r.phase)).toEqual(['read']);
    });

    it('skips audit when the grant does not ask for it (community)', async () => {
        const connector = new EchoConnector();
        const controlPlane = new FakeControlPlane({ allowed: true, audit: false, expiresAt: Date.now() + 60_000 });
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'write'));

        await runner.run('demo.echo', { id: 1 }, options);

        expect(controlPlane.written).toEqual([]);
        expect(connector.calls).toBe(1);
    });

    it('propagates a refused grant without calling the connector', async () => {
        const connector = new EchoConnector();
        const runner = new ActionRunner(new FakeControlPlane(new ActionError('denied', 403)))
            .register(definition(connector, 'read'));

        await expect(runner.run('demo.echo', {}, options)).rejects.toMatchObject({ status: 403 });
        expect(connector.calls).toBe(0);
    });

    it('refuses a grant that does not allow the run', async () => {
        const connector = new EchoConnector();
        const controlPlane = new FakeControlPlane({ allowed: false, audit: true, expiresAt: Date.now() + 60_000 });
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'write'));

        await expect(runner.run('demo.echo', { id: 1 }, options)).rejects.toMatchObject({ status: 403 });
        expect(connector.calls).toBe(0);
        expect(controlPlane.written).toEqual([]);
    });

    it('audits a finished write as done even when its result is not JSON', async () => {
        const connector = new XmlConnector();
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'write'));

        await expect(runner.run('demo.echo', { id: 1 }, options)).rejects.toMatchObject({
            status: 502,
            message: 'Action "demo.echo" returned a non-JSON result.',
        });
        expect(connector.calls).toBe(1);
        expect(controlPlane.written.map((r) => r.phase)).toEqual(['started', 'done']);
    });

    it('refuses a run whose business key fails, before anything else happens', async () => {
        const connector = new EchoConnector();
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane).register({
            ...definition(connector, 'write'),
            businessKey: () => {
                throw new Error('missing id');
            },
        });

        await expect(runner.run('demo.echo', {}, options)).rejects.toMatchObject({ status: 400 });
        expect(connector.calls).toBe(0);
        expect(controlPlane.written).toEqual([]);
    });

    it('logs a lost done audit and still returns the result', async () => {
        const error = jest.spyOn(logger, 'error').mockReturnValue(undefined);
        const connector = new EchoConnector();
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant, ['done']))
            .register(definition(connector, 'write'));

        await expect(runner.run('demo.echo', { id: 1 }, options)).resolves.toEqual({ echo: { id: 1 } });
        expect(error).toHaveBeenCalledWith(expect.stringContaining('Action audit lost (done demo.echo'), {});
    });

    it('logs a lost failed audit and keeps the connector error', async () => {
        const error = jest.spyOn(logger, 'error').mockReturnValue(undefined);
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant, ['failed']))
            .register(definition(new BrokenConnector(), 'write'));

        await expect(runner.run('demo.echo', { id: 1 }, options)).rejects.toMatchObject({
            status: 502,
            message: 'target system down',
        });
        expect(error).toHaveBeenCalledWith(expect.stringContaining('Action audit lost (failed demo.echo'), {});
    });

    it.each([
        ['stop and failed', (dto: ProcessDto) => dto.setStopProcess(ResultCode.STOP_AND_FAILED, 'Not authorized.'), 502],
        ['do not continue', (dto: ProcessDto) => dto.setStopProcess(ResultCode.DO_NOT_CONTINUE, 'Not authorized.'), 502],
        ['repeat', (dto: ProcessDto) => dto.setRepeater(60, 10, 'Not authorized.'), 503],
        ['limit exceeded', (dto: ProcessDto) => dto.setLimitExceeded('Not authorized.'), 503],
    ])('fails a run whose connector sets the %s result code', async (_, mark, status) => {
        const connector = new MarkingConnector(mark);
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane).register(definition(connector, 'write'));

        await expect(runner.run('demo.echo', { id: 1 }, options)).rejects.toMatchObject({
            status,
            message: 'Not authorized.',
        });
        expect(connector.calls).toBe(1);
        expect(controlPlane.written.map((r) => [r.phase, r.status])).toEqual([['started', undefined], ['failed', status]]);
    });

    it('fails a read whose connector sets a result code instead of returning data', async () => {
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant)).register(
            definition(new MarkingConnector((dto) => dto.setStopProcess(ResultCode.STOP_AND_FAILED, 'Not found.')), 'read'),
        );

        await expect(runner.run('demo.echo', { id: 1 }, options)).rejects.toMatchObject({ status: 502 });
    });

    it('accepts an explicit success result code', async () => {
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant)).register(
            definition(new MarkingConnector((dto) => dto.setJsonData({ ok: true }).setSuccessProcess()), 'read'),
        );

        await expect(runner.run('demo.echo', {}, options)).resolves.toEqual({ ok: true });
    });

    it('treats a repeat exception from the sender as worth retrying', async () => {
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant))
            .register(definition(new BrokenConnector(new OnRepeatException(60, 10, 'status: 503')), 'read'));

        await expect(runner.run('demo.echo', {}, options)).rejects.toMatchObject({ status: 503 });
    });

    it('keeps the full error for the caller but a short message in the audit', async () => {
        const controlPlane = new FakeControlPlane(auditedGrant);
        const runner = new ActionRunner(controlPlane)
            .register(definition(new BrokenConnector(new Error(`status: 500, body: ${'x'.repeat(600)}`)), 'write'));

        const error = await runner.run('demo.echo', { id: 1 }, options).catch((e: unknown) => e as ActionError);

        expect((error as ActionError).message.length).toBeGreaterThan(600);
        expect(controlPlane.written[1].message).toHaveLength(500);
        expect(controlPlane.written[1].status).toBe(502);
    });

    it.each([
        ['an empty application', { application: '' }],
        ['an empty name', { name: '' }],
        ['an unknown kind', { kind: 'Write' as unknown as ActionKind }],
        ['a zero timeout', { timeout: 0 }],
        ['a negative timeout', { timeout: -1 }],
        ['a NaN timeout', { timeout: NaN }],
        ['a timeout above the limit', { timeout: MAX_ACTION_TIMEOUT + 0.5 }],
        ['a connector of another application', { connector: new EchoConnector().setApplication(new TestBasicApplication()) }],
    ])('refuses to register an action with %s', (_, override) => {
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant));

        expect(() => runner.register({ ...definition(new EchoConnector(), 'read'), ...override }))
            .toThrow(/^Action ".*" needs a /u);
    });

    it('registers an action at the timeout limit with a connector of its own application', () => {
        const runner = new ActionRunner(new FakeControlPlane(auditedGrant)).register({
            ...definition(new EchoConnector().setApplication(new TestBasicApplication()), 'read'),
            application: 'test',
            timeout: MAX_ACTION_TIMEOUT,
        });

        expect(runner.list()).toHaveLength(1);
    });
});
