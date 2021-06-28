import { getTestContainer } from '../../../../test/TestAbstact';
import CoreServices from '../../../DIContainer/CoreServices';
import Mongo from '../Mongo';
import { metricsOptions } from '../../../Config/Config';

const container = getTestContainer();
const mongoDBClient = container.get(CoreServices.MONGO);
const mongo = new Mongo(mongoDBClient);

describe('tests Metrics Mongodb Sender', () => {
  it('send', async () => {
    expect(await mongo.send(metricsOptions.curlMeasurement, {}, {}))
      .toBeTruthy();
  });

  it('send - inccorect', async () => {
    expect(await mongo.send('', {}, {}))
      .toBeFalsy();
  });
});
