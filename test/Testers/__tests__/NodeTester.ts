import { getTestContainer } from '../../TestAbstact';
import NodeTester from '../NodeTester';
import DIContainer from '../../../lib/DIContainer/Container';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import MongoDbClient from '../../../lib/Storage/Mongodb/Client';
import Metrics from '../../../lib/Metrics/Metrics';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test NodeTester', () => {
  let container: DIContainer;
  beforeAll(async () => {
    container = await getTestContainer();
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('output - replacement', async () => {
    const tester = new NodeTester(container, __filename);
    await tester.testCustomNode('testcustom');
  });
});
