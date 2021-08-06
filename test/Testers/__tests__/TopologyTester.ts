import { getTestContainer } from '../../TestAbstact';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import TopologyTester from '../TopologyTester';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Test topologyTester', () => {
  it('', async () => {
    const dto = new ProcessDto();
    const tester = new TopologyTester(getTestContainer(), __filename);
    const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto);
    expect(res.length).toEqual(1);
    expect(res[0].jsonData).toEqual({ dataTest: 'testValue' });
  });
});
