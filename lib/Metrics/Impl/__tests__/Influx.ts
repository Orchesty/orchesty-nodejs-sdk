import Influx from '../Influx';

describe('tests Metrics Influx Sender', () => {
  it('send', async () => {
    const influx = new Influx();
    expect(await influx.send('', {}, {})).toBeTruthy();
  });
});
