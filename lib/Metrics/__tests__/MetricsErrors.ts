import { ITimesMetrics } from '../Metrics';
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

describe('Test metrics', () => {
  it('sendCurlMetrics', async () => {
    const metrics = container.get(CoreServices.METRICS);
    const curlMetrics = await metrics.sendCurlMetrics(mockITimesMetrics);
    expect(curlMetrics).toBeDefined();
    expect(typeof curlMetrics === 'boolean').toBeTruthy();
  });

  it('sendProcessMetrics', async () => {
    const metrics = container.get(CoreServices.METRICS);
    const processMetric = await metrics.sendProcessMetrics(mockITimesMetrics);
    expect(processMetric).toBeDefined();
    expect(typeof processMetric === 'boolean').toBeTruthy();
  });
});
