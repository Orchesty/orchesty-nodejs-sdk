import { metricsOptions } from '../../../Config/Config';
import Influx from '../Influx';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('metrics-sender/dist/lib/udp/Sender');

describe('tests Metrics Influx Sender', () => {
  it('send', async () => {
    if (process.env.JEST_DOCKER) {
      metricsOptions.dsn = 'kapacitor:5005';
    } else {
      metricsOptions.dsn = '127.0.0.40:5120';
    }
    const influx = new Influx();
    expect(await influx.send('', {}, {})).toBeTruthy();
  });
});
