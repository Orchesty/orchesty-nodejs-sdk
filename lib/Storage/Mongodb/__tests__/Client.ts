import { getTestContainer } from '../../../../test/TestAbstact';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import { storageOptions } from '../../../Config/Config';
import CryptManager from '../../../Crypt/CryptManager';
import WindWalkerCrypt from '../../../Crypt/Impl/WindWalkerCrypt';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import MongoDbClient from '../Client';
import Repository from '../Repository';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
    error: () => jest.fn(),
    info: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test MongoDb Storage', () => {
    let cryptManager: CryptManager;
    let dbClient: MongoDbClient;
    let container: DIContainer;

    beforeAll(async () => {
        container = await getTestContainer();
        cryptManager = new CryptManager([new WindWalkerCrypt('123')]);
        dbClient = new MongoDbClient(storageOptions.dsn, cryptManager, container);
    });

    afterAll(async () => {
        await dbClient.down();
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('repository', async () => {
        const appInstallRepo = await dbClient.getRepository(ApplicationInstall);
        expect(appInstallRepo).toBeInstanceOf(Repository);
    });

    it('appInstall repository', async () => {
        const appInstallRepo = await dbClient.getApplicationRepository();
        expect(appInstallRepo).toBeInstanceOf(Repository);
    });
});
