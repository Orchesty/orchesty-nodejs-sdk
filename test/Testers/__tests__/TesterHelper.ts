import { mockCurl } from '../TesterHelpers';
import { container } from '../../TestAbstact';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import CurlSender from '../../../lib/Transport/Curl/CurlSender';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import HttpMethods from '../../../lib/Transport/HttpMethods';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const sender = container.get(CoreServices.CURL) as CurlSender;
describe('Test topologyHelper', () => {
  it('mockCurl - replacements', async () => {
    const spy = mockCurl(__filename, sender);

    const reqDto = new RequestDto(
      'https://api.com/api/products/changes?from=2021-07-31T13%3A37%3A00%2B0200&itemsPerPage=100&page=1',
      HttpMethods.GET,
      '',
    );
    const res = await sender.send(reqDto);
    expect(res.jsonBody).toEqual({ product: { one: 1, date: 'some date' } });

    spy?.mockRestore();
  });
});
