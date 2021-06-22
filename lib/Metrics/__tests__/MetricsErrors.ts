import { ITimesMetrics, sendCurlMetrics, sendProcessMetrics } from '../Metrics';

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

describe('Test metrics', () => {
  it('sendCurlMetrics', async () => {
    const curlMetrics = await sendCurlMetrics(mockITimesMetrics);
    expect(curlMetrics).toBeDefined();
    expect(typeof curlMetrics === 'string').toBeTruthy();
  });

  it('sendProcessMetrics', async () => {
    const processMetric = await sendProcessMetrics(mockITimesMetrics);
    expect(processMetric).toBeDefined();
    expect(typeof processMetric === 'string').toBeTruthy();
  });
});
