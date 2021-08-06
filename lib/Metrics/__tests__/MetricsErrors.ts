import Metrics, { ITimesMetrics } from '../Metrics';
import { getTestContainer } from '../../../test/TestAbstact';
import CoreServices from '../../DIContainer/CoreServices';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const mockITimesMetrics: ITimesMetrics = {
  requestDuration: BigInt(9907199254740999),
  userTime: 5,
  kernelTime: 5,
};

const container = getTestContainer();
let metrics: Metrics;

describe('Test metrics', () => {
  beforeAll(() => {
    metrics = container.get(CoreServices.METRICS);
  });

  afterAll(async () => {
    await metrics.close();
  });

  it('sendCurlMetrics', async () => {
    const curlMetrics = await metrics.sendCurlMetrics(mockITimesMetrics);
    expect(curlMetrics).toBeDefined();
    expect(typeof curlMetrics === 'boolean').toBeTruthy();
    await metrics.close();
  });

  it('sendProcessMetrics', async () => {
    const processMetric = await metrics.sendProcessMetrics(mockITimesMetrics);
    expect(processMetric).toBeDefined();
    expect(typeof processMetric === 'boolean').toBeTruthy();
  });
});
