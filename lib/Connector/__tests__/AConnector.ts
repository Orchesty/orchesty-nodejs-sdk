import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import TestConnector from '../../../test/Connector/TestConnector';
import { getTestContainer } from '../../../test/TestAbstact';
import { IApplication } from '../../Application/Base/IApplication';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import ProcessDto from '../../Utils/ProcessDto';

describe('Test AConnector', () => {
    let container: DIContainer;
    let mongoDbClient: MongoDbClient;
    let curlSender: CurlSender;
    let testConnector: TestConnector;
    let repo: ApplicationInstallRepository<ApplicationInstall>;

    beforeAll(async () => {
        container = await getTestContainer();
        mongoDbClient = container.get(CoreServices.MONGO);
        curlSender = container.get(CoreServices.CURL);
        testConnector = new TestConnector();
        repo = await mongoDbClient.getApplicationRepository();
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
    });

    it('should set database of connector', () => {
        testConnector.setDb(mongoDbClient);
        const testConnectorDatabaseURL = Reflect.get(testConnector, 'db').dsn;
        expect(process.env.MONGODB_DSN).toEqual(testConnectorDatabaseURL);
    });

    it('should set application of connector', () => {
        const application = new TestBasicApplication();
        testConnector.setApplication(application);
        const testConnectorApplicationName = (Reflect.get(testConnector, 'application') as IApplication).getName();
        expect(application.getName()).toEqual(testConnectorApplicationName);
    });

    it('should set sender of connector', () => {
        testConnector.setSender(curlSender);
        const testConnectorCurlSender = Reflect.get(testConnector, 'sender');
        expect(testConnectorCurlSender).toEqual(curlSender);
    });

    it('should return applicationInstall', async () => {
        const app = new ApplicationInstall();
        const user = 'testUser';
        app
            .setEnabled(true)
            .setUser(user)
            .setName('test');
        await repo.insert(app);

        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);

        const dto = new ProcessDto();
        dto.setHeaders({ user });
        const res = await testConnector.getApplicationInstallFromHeaders(dto);
        expect(res.getUser()).toEqual(user);
    });

    it('should throw error', async () => {
        const app = new ApplicationInstall();
        const user = 'testUser';
        app
            .setUser(user)
            .setName('test');
        await repo.insert(app);

        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);

        const dto = new ProcessDto();
        dto.setHeaders({});
        try {
            await testConnector.getApplicationInstallFromHeaders(dto);
        } catch (e) {
            expect(e).toEqual(Error('User not defined'));
        }
    });
});
