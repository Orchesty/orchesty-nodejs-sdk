import { IApplication } from '../Application/Base/IApplication';
import { ApplicationInstall } from '../Application/Database/ApplicationInstall';
import DatabaseClient from '../Storage/Database/Client';
import AProcessDto from '../Utils/AProcessDto';
import { IAuditCheckpoint } from './IAuditCheckpoint';
import { INode } from './INode';

export default abstract class ANode implements INode {

    private application?: IApplication;

    private db?: DatabaseClient;

    public abstract processAction(dto: AProcessDto): AProcessDto | Promise<AProcessDto>;

    public abstract getName(): string;

    /**
     * Declares this node as a business audit checkpoint. Default `null` = neutral
     * node, no audit emission. To make a node auditable, override this in the
     * concrete class and return a {@link IAuditCheckpoint} spec.
     *
     * Where to put the override (in priority order):
     *
     * 1. **Boundary connector** (recommended for `process_entry` / `process_exit`).
     *    Override directly on the input/output `AConnector`. The Bridge emits
     *    the audit log AFTER the connector's `processAction` returns, so the
     *    log line carries the actual delivery outcome (`resultStatus=success`
     *    when the external call succeeded, `failed` when it threw, etc.). This
     *    is the only way to truthfully audit "the entity entered / left the
     *    process" — a passthrough wrapper sitting before the connector cannot
     *    know whether the downstream delivery succeeded.
     *
     * 2. **{@link AuditCheckpointNode} passthrough** for `process_step` markers
     *    in the middle of a chain, OR when the boundary node is not a connector
     *    (e.g. a webhook custom node) and you want to keep audit declaration
     *    out of the business code.
     *
     * The SDK Router serializes the returned spec into the `audit-checkpoint`
     * response header on BOTH success and error responses, so the Bridge always
     * sees the spec and can emit the audit line with the proper resultStatus.
     * The Bridge parses it, applies the `fields` allowlist on the request body
     * (= what the connector tried to deliver) and emits a structured INFO log
     * to Loki enriched with `resultCode/resultStatus/resultMessage/httpStatus`.
     */
    public getAuditCheckpoint(): IAuditCheckpoint | null {
        return null;
    }

    public setApplication(application: IApplication): this {
        this.application = application;

        return this;
    }

    public setDb(db: DatabaseClient): this {
        this.db = db;

        return this;
    }

    public getApplicationName(): string {
        try {
            return this.getApplication().getName();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            return '';
        }
    }

    protected getApplication<T extends IApplication>(): T {
        if (this.application) {
            return this.application as T;
        }

        throw new Error('Application has not been set.');
    }

    protected getDbClient(): DatabaseClient {
        if (this.db) {
            return this.db;
        }

        throw new Error('MongoDbClient has not been set.');
    }

    protected async getApplicationInstall(
        user: string | undefined,
        sdk: string,
        enabled: boolean | null = true,
        deleted?: boolean,
    ): Promise<ApplicationInstall> {
        const repo = this.getDbClient().getApplicationRepository();
        let appInstall: ApplicationInstall | undefined;
        if (user) {
            appInstall = await repo.findByNameAndUser(this.getApplication().getName(), user, [sdk], enabled, deleted);
        } else {
            appInstall = await repo.findOneByName(this.getApplication().getName(), [sdk], enabled, deleted);
        }

        if (!appInstall) {
            throw new Error(
                `ApplicationInstall with user [${user}] and name [${this.getApplication().getName()}] has not been found!`,
            );
        }

        return appInstall;
    }

    protected async getApplicationInstallFromProcess(
        dto: AProcessDto,
        enabled: boolean | null = true,
        deleted?: boolean,
    ): Promise<ApplicationInstall> {
        const user = dto.getUser();
        if (!user) {
            throw Error('User not defined');
        }
        const sdk = dto.getSdk();
        if (!sdk) {
            throw Error('Sdk not defined');
        }
        return this.getApplicationInstall(user, sdk, enabled, deleted);
    }

}
