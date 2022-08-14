import Influx from '../Influx';

// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.mock('metrics-sender/dist/lib/metrics/Metrics', () => {});

describe('tests Metrics Influx Sender', () => {
  it('send', async () => {
    const influx = new Influx();
    expect(await influx.send('', {}, {})).toBeFalsy();
  });
});
