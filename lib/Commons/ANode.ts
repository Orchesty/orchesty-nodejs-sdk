import { IApplication } from '../Application/Base/IApplication';
import { ApplicationInstall } from '../Application/Database/ApplicationInstall';
import MongoDbClient from '../Storage/Mongodb/Client';
import AProcessDto from '../Utils/AProcessDto';
import { INode } from './INode';

export default abstract class ANode implements INode {

    private application?: IApplication;

    private db?: MongoDbClient;

    public abstract processAction(dto: AProcessDto): AProcessDto | Promise<AProcessDto>;

    public abstract getName(): string;

    public setApplication(application: IApplication): this {
        this.application = application;

        return this;
    }

    public setDb(db: MongoDbClient): this {
        this.db = db;

        return this;
    }

    protected getApplication<T extends IApplication>(): T {
        if (this.application) {
            return this.application as T;
        }

        throw new Error('Application has not been set.');
    }

    protected getDbClient(): MongoDbClient {
        if (this.db) {
            return this.db;
        }

        throw new Error('MongoDbClient has not been set.');
    }

    protected async getApplicationInstall(
        user?: string,
        enabled: boolean | null = true,
    ): Promise<ApplicationInstall> {
        const repo = this.getDbClient().getApplicationRepository();
        let appInstall: ApplicationInstall | undefined;
        if (user) {
            appInstall = await repo.findByNameAndUser(this.getApplication().getName(), user, enabled);
        } else {
            appInstall = await repo.findOneByName(this.getApplication().getName(), enabled);
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
    ): Promise<ApplicationInstall> {
        const user = dto.getUser();
        if (!user) {
            throw Error('User not defined');
        }
        return this.getApplicationInstall(user, enabled);
    }

}
