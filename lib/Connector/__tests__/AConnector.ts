import { getTestContainer } from '../../../test/TestAbstact';
import TestConnector from '../../../test/Connector/TestConnector';
import CoreServices from '../../DIContainer/CoreServices';
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import DIContainer from '../../DIContainer/Container';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import Metrics from '../../Metrics/Metrics';
import ProcessDto from '../../Utils/ProcessDto';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import ResponseDto from '../../Transport/Curl/ResponseDto';
import { Headers } from 'node-fetch';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('it should set database of connector', () => {
    testConnector.setDb(mongoDbClient);
    const testConnectorDatabaseURL = Reflect.get(testConnector, 'db')._dsn;
    expect(process.env.MONGODB_DSN).toEqual(testConnectorDatabaseURL);
  });

  it('it should set application of connector', () => {
    const application = new TestBasicApplication();
    testConnector.setApplication(application);
    const testConnectorApplicationName = Reflect.get(testConnector, 'application').getName();
    expect(application.getName()).toEqual(testConnectorApplicationName);
  });

  it('it should set sender of connector', () => {
    testConnector.setSender(curlSender);
    const testConnectorCurlSender = Reflect.get(testConnector, 'sender');
    expect(testConnectorCurlSender).toEqual(curlSender);
  });

  it('it shouldnt set dto stop process on dto', () => {
    const dto = new ProcessDto();
    const response = new ResponseDto('body', 200, new Headers({}));
    testConnector.evaluateStatusCode(response, dto);
    expect(dto.headers).toEqual({});
  });

  it('it should set dto stop process on dto', () => {
    const dto = new ProcessDto();
    const response = new ResponseDto('body', 205, new Headers({}));
    testConnector.evaluateStatusCode(response, dto);
    expect(dto.headers).toEqual({ "pf-result-code": "1006" });
  });

  it('it should return applicationInstall', async () => {
    const repo = await mongoDbClient.getRepository(ApplicationInstall);
    const app = new ApplicationInstall();
    const user = 'testUser';
    app.setUser(user)
    .setName('test')
    await repo.insert(app);
    const application = new TestBasicApplication();
    testConnector.setDb(mongoDbClient);
    testConnector.setApplication(application)
    const dto = new ProcessDto();
    dto.headers = { 'pf-user': user };
    const res = await testConnector.getApplicationInstallFromHeaders(dto)
    expect(res.getUser()).toEqual(user);
  });

  it('it should throw error', async () => {
    const repo = await mongoDbClient.getRepository(ApplicationInstall);
    const app = new ApplicationInstall();
    const user = 'testUser';
    app.setUser(user)
    .setName('test')
    await repo.insert(app);
    const application = new TestBasicApplication();
    testConnector.setDb(mongoDbClient);
    testConnector.setApplication(application)
    const dto = new ProcessDto();
    dto.headers = {};
    try {
      await testConnector.getApplicationInstallFromHeaders(dto);
    }catch (e) {
     expect(e).toEqual(Error('User not defined'));
    }
  });
});
