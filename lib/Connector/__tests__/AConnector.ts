import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import TestConnector from '../../../test/Connector/TestConnector';
import { appInstallConfig, mockOnce } from '../../../test/MockServer';
import { getTestContainer, NAME, USER } from '../../../test/TestAbstact';
import { IApplication } from '../../Application/Base/IApplication';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ApplicationInstallRepository from '../../Application/Database/ApplicationInstallRepository';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import { HttpMethods } from '../../Transport/HttpMethods';
import ProcessDto from '../../Utils/ProcessDto';

describe('Test AConnector', () => {
    let container: DIContainer;
    let mongoDbClient: MongoDbClient;
    let curlSender: CurlSender;
    let testConnector: TestConnector;
    let repo: ApplicationInstallRepository;

    beforeAll(() => {
        container = getTestContainer();
        mongoDbClient = container.get(CoreServices.MONGO);
        curlSender = container.get(CoreServices.CURL);
        testConnector = new TestConnector();
        repo = mongoDbClient.getApplicationRepository();
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
        app
            .setEnabled(true)
            .setUser(USER)
            .setName(NAME);
        await repo.insert(app);

        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"keys":["${application.getName()}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        repo.clearCache();

        const dto = new ProcessDto();
        dto.setHeaders({ user: USER });
        const res = await testConnector.getApplicationInstallFromHeaders(dto);
        expect(res.getUser()).toEqual(USER);
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
