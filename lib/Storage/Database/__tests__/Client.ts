import { getTestContainer } from '../../../../test/TestAbstact';
import { ApplicationInstall } from '../../../Application/Database/ApplicationInstall';
import DIContainer from '../../../DIContainer/Container';
import DatabaseClient from '../Client';
import Repository from '../Repository';

describe('Test MongoDb Storage', () => {
    let dbClient: DatabaseClient;
    let container: DIContainer;

    beforeAll(() => {
        container = getTestContainer();
        dbClient = new DatabaseClient(container);
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
