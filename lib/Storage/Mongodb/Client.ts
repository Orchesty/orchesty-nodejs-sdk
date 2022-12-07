import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import { orchestyOptions } from '../../Config/Config';
import CryptManager from '../../Crypt/CryptManager';
import DIContainer from '../../DIContainer/Container';
import Client from '../../Worker-api/Client';
import ADocument, { ClassType } from './ADocument';
import Repository, { IQuery } from './Repository';

export default class MongoDbClient {

    private readonly workerApi = new Client(orchestyOptions.workerApi);

    public constructor(
        private readonly cryptManager: CryptManager,
        private readonly container: DIContainer,
    ) {}

    public getClient(): Client {
        return this.workerApi;
    }

    public getRepository<Q extends IQuery, T extends ADocument>(collection: ClassType<T>): Repository<T, Q> {
        try {
            return this.container.getRepository(collection);
        } catch (e) {}

        return new Repository(
            collection,
            this.getClient(),
            this.cryptManager,
        );
    }

    public getApplicationRepository(): ApplicationInstallRepository {
        return this.getRepository(ApplicationInstall) as ApplicationInstallRepository;
    }

}
