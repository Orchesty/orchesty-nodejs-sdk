import DIContainer from '../../../lib/DIContainer/Container';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import Metrics from '../../../lib/Metrics/Metrics';
import MongoDbClient from '../../../lib/Storage/Mongodb/Client';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import { getTestContainer } from '../../TestAbstact';
import TopologyTester from '../TopologyTester';

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

  it('Run without specific StartingPoint', async () => {
    const dto = new ProcessDto();
    const tester = new TopologyTester(container, __filename);
    const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto);
    expect(res).toHaveLength(1);
    expect(res[0].jsonData).toEqual({ dataTest: 'testValue' });
  });

  it('Run with specific StartingPoint', async () => {
    const dto = new ProcessDto();
    const tester = new TopologyTester(container, __filename);
    const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto, '', 'Start');
    expect(res).toHaveLength(1);
    expect(res[0].jsonData).toEqual({ dataTest: 'testValue' });
  });
});
