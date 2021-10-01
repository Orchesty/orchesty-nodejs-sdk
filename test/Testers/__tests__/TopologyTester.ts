import { getTestContainer } from '../../TestAbstact';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import TopologyTester from '../TopologyTester';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import MongoDbClient from '../../../lib/Storage/Mongodb/Client';
import Metrics from '../../../lib/Metrics/Metrics';
import DIContainer from '../../../lib/DIContainer/Container';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test topologyTester', () => {
  let container: DIContainer;

  beforeAll(async () => {
    container = await getTestContainer();
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('', async () => {
    const dto = new ProcessDto();
    const tester = new TopologyTester(container, __filename);
    const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto);
    expect(res.length).toEqual(1);
    expect(res[0].jsonData).toEqual({ dataTest: 'testValue' });
  });
});
