import DIContainer from '../Container';
import { CONNECTOR_PREFIX } from '../../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../../CustomNode/CustomNodeRouter';
import { getTestContainer } from '../../../test/TestAbstact';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const container = getTestContainer();
const testConnector = container.get(`${CONNECTOR_PREFIX}.test`);

describe('Test DIContainer', () => {
  it('test set/has service', () => {
    const serviceName = 'testService';
    container.set(serviceName, 'fake-service');

    expect(container.has(serviceName)).toBeTruthy();
  });

  it('test set/get service', () => {
    const serviceName = 'testService2';
    container.set(serviceName, 'fake-service');

    expect(container.get(serviceName)).toEqual('fake-service');
  });

  it('test set duplicate service', () => {
    const serviceName = 'testService3';
    container.set(serviceName, 'fake-service');

    try {
      container.set(serviceName, 'fake-service');
      expect(false).toBeTruthy();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('test get non-exist service', () => {
    const serviceName = 'non-exist';
    try {
      container.get(serviceName);
      expect(false).toBeTruthy();
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('test set/get Connector service', () => {
    const serviceName = 'testService4';
    container.setConnector(serviceName, testConnector);

    expect(container.get(`${CONNECTOR_PREFIX}.${serviceName}`)).toEqual(testConnector);
  });

  it('test set/get CustomNode service', () => {
    const serviceName = 'testService5';
    container.setCustomNode(serviceName, testConnector);

    expect(container.get(`${CUSTOM_NODE_PREFIX}.${serviceName}`)).toEqual(testConnector);
  });

  it('test set/getAllByPrefix services', () => {
    const container2 = new DIContainer();
    container2.setConnector('testService6', testConnector);
    container2.setConnector('testService7', testConnector);

    expect(container2.getAllByPrefix(CUSTOM_NODE_PREFIX)).toEqual([testConnector, testConnector]);
  });
});
