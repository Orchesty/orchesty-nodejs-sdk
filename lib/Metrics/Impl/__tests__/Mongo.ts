import { getTestContainer } from '../../../../test/TestAbstact';
import { metricsOptions } from '../../../Config/Config';
import DIContainer from '../../../DIContainer/Container';
import CoreServices from '../../../DIContainer/CoreServices';
import MongoDbClient from '../../../Storage/Mongodb/Client';
import Mongo from '../Mongo';

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('tests Metrics Mongodb Sender', () => {
  let container: DIContainer;
  let mongoDBClient: MongoDbClient;
  let mongo: Mongo;

  beforeAll(async () => {
    container = await getTestContainer();
    mongoDBClient = container.get(CoreServices.MONGO);
    mongo = new Mongo(mongoDBClient);
  });

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
