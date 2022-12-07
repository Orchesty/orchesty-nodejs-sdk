import { getTestContainer } from '../../../../test/TestAbstact';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import CryptManager from '../../../Crypt/CryptManager';
import WindWalkerCrypt from '../../../Crypt/Impl/WindWalkerCrypt';
import DIContainer from '../../../DIContainer/Container';
import MongoDbClient from '../Client';
import Repository from '../Repository';

describe('Test MongoDb Storage', () => {
    let cryptManager: CryptManager;
    let dbClient: MongoDbClient;
    let container: DIContainer;

    beforeAll(() => {
        container = getTestContainer();
        cryptManager = new CryptManager([new WindWalkerCrypt('123')]);
        dbClient = new MongoDbClient(cryptManager, container);
    });

    it('repository', () => {
        const appInstallRepo = dbClient.getRepository(ApplicationInstall);
        expect(appInstallRepo).toBeInstanceOf(Repository);
    });

    it('appInstall repository', () => {
        const appInstallRepo = dbClient.getApplicationRepository();
        expect(appInstallRepo).toBeInstanceOf(Repository);
    });
});
