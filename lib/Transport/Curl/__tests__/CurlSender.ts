import CurlSender from '../CurlSender';
import CoreServices from '../../../DIContainer/CoreServices';
import Metrics from '../../../Metrics/Metrics';
import { getTestContainer, mockedFetch } from '../../../../test/TestAbstact';
import RequestDto from '../RequestDto';
import HttpMethods from '../../HttpMethods';
import DIContainer from '../../../DIContainer/Container';
import MongoDbClient from '../../../Storage/Mongodb/Client';

let container: DIContainer;
let curlSender: CurlSender;

// Mock Logger module
jest.mock('../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  log: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('tests for curlSender', () => {
  beforeAll(async () => {
    container = await getTestContainer();
    curlSender = container.get(CoreServices.CURL);
  });

  afterEach(() => {
    mockedFetch.reset();
    mockedFetch.restore();
  });

  afterAll(async () => {
    await (container.get(CoreServices.MONGO) as MongoDbClient).down();
    await (container.get(CoreServices.METRICS) as Metrics).close();
  });

  it('should test send', async () => {
    const url = 'http://testUrl.com/status';
    mockedFetch.get(
      url,
      JSON.stringify({ id: '1' }),
    );
    const response = await curlSender.send(new RequestDto(url, HttpMethods.GET));
    expect((response.jsonBody as { id: string }).id).toBe('1');
  });

  it('should test send - 400', async () => {
    const url = 'http://testUrl.com/status';
    mockedFetch.get(url, 400);
    const response = await curlSender.send(new RequestDto(url, HttpMethods.GET));
    expect(response.responseCode).toBe(400);
  });

  it('should test send - 400 and only 200 is allowed', async () => {
    const url = 'http://testUrl.com/status';
    mockedFetch.get(url, 400);
    try {
      await curlSender.send(new RequestDto(url, HttpMethods.GET), [200]);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should test send - body', async () => {
    const url = 'http://testUrl.com/status';
    mockedFetch.post(url, 200);
    try {
      await curlSender.send(new RequestDto(url, HttpMethods.POST, JSON.stringify({ message: 'ok' })));
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
