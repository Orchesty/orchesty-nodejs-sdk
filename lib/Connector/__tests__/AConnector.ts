import { getTestContainer } from '../../../test/TestAbstact';
import TestConnector from '../../../test/Connector/TestConnector';
import CoreServices from '../../DIContainer/CoreServices';
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import AConnector from '../AConnector';
import DIContainer from '../../DIContainer/Container';
import MongoDbClient from '../../Storage/Mongodb/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import Metrics from '../../Metrics/Metrics';

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
  let testConnector: AConnector;

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
});
