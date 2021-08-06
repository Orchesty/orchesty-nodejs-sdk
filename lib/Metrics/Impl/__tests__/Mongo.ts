import { getTestContainer } from '../../../../test/TestAbstact';
import CoreServices from '../../../DIContainer/CoreServices';
import Mongo from '../Mongo';
import { metricsOptions } from '../../../Config/Config';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const container = getTestContainer();
const mongoDBClient = container.get(CoreServices.MONGO);
const mongo = new Mongo(mongoDBClient);

describe('tests Metrics Mongodb Sender', () => {
  afterAll(async () => {
    await mongo.close();
  });

  it('send', async () => {
    expect(await mongo.send(metricsOptions.curlMeasurement, {}, {}))
      .toBeTruthy();
  });

  it('send - inccorect', async () => {
    expect(await mongo.send('', {}, {}))
      .toBeFalsy();
  });
});
