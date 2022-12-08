import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import Client from '../../Worker-api/Client';
import ADocument, { ClassType } from './ADocument';
import Repository, { IFilter, IPaging, ISorter } from './Repository';

export default class MongoDbClient {

    private readonly workerApi = new Client(orchestyOptions.workerApi);

    public constructor(
        private readonly container: DIContainer,
    ) {}

    public getClient(): Client {
        return this.workerApi;
    }

    public getRepository
    <T extends ADocument, F extends IFilter, S extends ISorter, P extends IPaging>(collection: ClassType<T>):
    Repository<T, F, S, P> {
        return this.container.getRepository(collection);
    }

    public getApplicationRepository(): ApplicationInstallRepository {
        return this.getRepository(ApplicationInstall) as ApplicationInstallRepository;
    }

}
