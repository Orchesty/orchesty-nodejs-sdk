import { Headers } from 'node-fetch';
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import TestConnector from '../../../test/Connector/TestConnector';
import { getTestContainer } from '../../../test/TestAbstact';
import { IApplication } from '../../Application/Base/IApplication';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import Metrics from '../../Metrics/Metrics';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import ProcessDto from '../../Utils/ProcessDto';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    log: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test AConnector', () => {
    let container: DIContainer;
    let mongoDbClient: MongoDbClient;
    let curlSender: CurlSender;
    let testConnector: TestConnector;

    beforeAll(async () => {
        container = await getTestContainer();
        mongoDbClient = container.get(CoreServices.MONGO);
        curlSender = container.get(CoreServices.CURL);
        testConnector = new TestConnector();
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
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

    it('shouldnt set dto stop process on dto', () => {
        const dto = new ProcessDto();
        const response = new ResponseDto('body', 200, new Headers({}));
        testConnector.evaluateStatusCode(response, dto, 'error');
        expect(dto.headers).toEqual({});
    });

    it('should set dto stop process on dto', () => {
        const dto = new ProcessDto();
        const response = new ResponseDto('body', 205, new Headers({}));
        testConnector.evaluateStatusCode(response, dto, 'error');
        expect(dto.headers).toEqual({ 'result-code': '1006', 'result-message': 'error' });
    });

    it('should return applicationInstall', async () => {
        const repo = await mongoDbClient.getRepository(ApplicationInstall);
        const app = new ApplicationInstall();
        const user = 'testUser';
        app.setUser(user)
            .setName('test');
        await repo.insert(app);
        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);
        const dto = new ProcessDto();
        dto.headers = { user };
        const res = await testConnector.getApplicationInstallFromHeaders(dto);
        expect(res.getUser()).toEqual(user);
    });

    it('should throw error', async () => {
        const repo = await mongoDbClient.getRepository(ApplicationInstall);
        const app = new ApplicationInstall();
        const user = 'testUser';
        app.setUser(user)
            .setName('test');
        await repo.insert(app);
        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);
        const dto = new ProcessDto();
        dto.headers = {};
        try {
            await testConnector.getApplicationInstallFromHeaders(dto);
        } catch (e) {
            expect(e).toEqual(Error('User not defined'));
        }
    });
});
