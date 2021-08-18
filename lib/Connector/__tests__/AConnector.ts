import { getTestContainer } from '../../../test/TestAbstact';
import TestConnector from '../../../test/Connector/TestConnector';
import CoreServices from '../../DIContainer/CoreServices';
import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import AConnector from '../AConnector';

const container = getTestContainer();
const mongoDbClient = container.get(CoreServices.MONGO);
const curlSender = container.get(CoreServices.CURL);

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test AConnector', () => {
  const testConnector: AConnector = new TestConnector();

  it('it should set database of connector', () => {
    testConnector.setDb(mongoDbClient);
    const testConnectorDatabaseURL = Reflect.get(testConnector, 'db')._dsn;
    expect(mongoDbClient._dsn).toEqual(testConnectorDatabaseURL);
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
