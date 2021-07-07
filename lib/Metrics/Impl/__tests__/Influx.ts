import Influx from '../Influx';
import { metricsOptions } from '../../../Config/Config';

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
