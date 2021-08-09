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
    // Todo : need a method out of the box to get the database so I can test that I've the right db
  });

  it('it should set application of connector', () => {
    const application = new TestBasicApplication();
    testConnector.setApplication(application);
    // Todo : need a method that I've the right application which is not protect.
  });

  it('it should set sender of connector' ,() => {
    testConnector.setSender(curlSender);
    // Todo : need a method to get the sender so I can do some assertions
  });
});
