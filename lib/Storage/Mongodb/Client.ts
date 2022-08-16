import { Db, MongoClient } from 'mongodb';
import { ClassType } from 'mongodb-typescript';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import CryptManager from '../../Crypt/CryptManager';
import DIContainer from '../../DIContainer/Container';
import logger from '../../Logger/Logger';
import { IDocument } from './ADocument';
import Repository from './Repository';

export default class MongoDbClient {

    private readonly clClient: MongoClient;

    public constructor(
        private readonly dsn: string,
        private readonly cryptManager: CryptManager,
        private readonly container: DIContainer,
    ) {
        this.clClient = new MongoClient(this.dsn, { connectTimeoutMS: 10000, keepAlive: true });
    }

    public get client(): MongoClient {
        return this.clClient;
    }

    public async down(): Promise<void> {
        await this.clClient.close(true);
    }

    public async reconnect(): Promise<void> {
        try {
            await this.clClient.connect();
            logger.info('⚡️[server]: MongoDB Connected.', {});
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message, {});
            }
        }
    }

    public async db(name?: string): Promise<Db> {
        await this.clClient.connect();

        return this.clClient.db(name);
    }

    public async getRepository<T extends IDocument>(className: ClassType<T>): Promise<Repository<T>> {
        try {
            const repo = this.container.getRepository(className);
            await repo.createIndexes(true);

            return repo;
        } catch (e) {
            // Ignore and create new repo
        }

        const repo = new Repository(
            className,
            this.clClient,
            (className as unknown as IDocument).getCollection(),
            this.cryptManager,
        );
        await repo.createIndexes(true);

        return repo;
    }

    public async getApplicationRepository(): Promise<ApplicationInstallRepository<ApplicationInstall>> {
        return await this.getRepository(ApplicationInstall) as ApplicationInstallRepository<ApplicationInstall>;
    }

}
