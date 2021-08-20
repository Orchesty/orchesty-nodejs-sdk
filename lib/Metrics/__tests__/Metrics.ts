import { ICpuTimes } from '../../Utils/SystemUsage';
import Metrics, { IStartMetrics, ITimesMetrics } from '../Metrics';
import CoreServices from '../../DIContainer/CoreServices';
import { getTestContainer } from '../../../test/TestAbstact';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const mockCpuTimes: ICpuTimes = {
  cpuUserCodeTime: 1,
  cpuKernelCodeTime: 1,
  cpuStartTime: 1,
};

const mockIStartMetrics: IStartMetrics = {
  timestamp: Number(9007199254740991),
  cpu: mockCpuTimes,
};

const mockITimesMetrics: ITimesMetrics = {
  requestDuration: Number(9907199254740999),
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

  it('getTimes', () => {
    const times = Metrics.getTimes(mockIStartMetrics);
    expect(times).toHaveProperty('requestDuration');
    expect(typeof times.requestDuration).toEqual('number');
    expect(times).toHaveProperty('userTime');
    expect(typeof times.userTime).toEqual('number');
    expect(times).toHaveProperty('kernelTime');
    expect(typeof times.kernelTime).toEqual('number');
  });

  it('getCurrentMetrics', () => {
    const currentMetrics = Metrics.getCurrentMetrics();

    expect(currentMetrics).toHaveProperty('timestamp');
    expect(typeof currentMetrics.timestamp).toEqual('number');
    expect(currentMetrics).toHaveProperty('cpu');

    const { cpu } = currentMetrics;
    expect(cpu).toHaveProperty('cpuUserCodeTime');
    expect(typeof cpu.cpuUserCodeTime).toEqual('number');
    expect(cpu).toHaveProperty('cpuKernelCodeTime');
    expect(typeof cpu.cpuKernelCodeTime).toEqual('number');
    expect(cpu).toHaveProperty('cpuStartTime');
    expect(typeof cpu.cpuStartTime).toEqual('number');
  });

  it('sendCurlMetrics', async () => {
    const curlMetrics = await metrics.sendCurlMetrics(
      mockITimesMetrics,
      'randomNodeId',
      'randomCorrelationId',
      'randomUser',
      'randomAppKey',
    );
    expect(curlMetrics).toBeDefined();
  });

  it('sendProcessMetrics', async () => {
    const processMetric = await metrics.sendProcessMetrics(
      mockITimesMetrics,
      'randomTopologyId',
      'randomNodeId',
      'randomCorrelationId',
    );
    expect(processMetric).toBeDefined();
  });
});
