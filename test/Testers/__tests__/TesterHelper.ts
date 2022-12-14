import { initiateContainer } from '../../../lib';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import CurlSender from '../../../lib/Transport/Curl/CurlSender';
import RequestDto from '../../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../../lib/Transport/HttpMethods';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import { container } from '../../TestAbstact';
import { mockCurl } from '../TesterHelpers';

describe('Test topologyHelper', () => {
    let sender: CurlSender;

    beforeAll(() => {
        initiateContainer();
        sender = container.get(CoreServices.CURL);
    });

    it('mockCurl - replacements', async () => {
        const mockAdapter = mockCurl(__filename);

        const reqDto = new RequestDto(
            'https://api.com/api/products/changes?from=2021-07-31T13%3A37%3A00%2B0200&itemsPerPage=100&page=1',
            HttpMethods.GET,
            new ProcessDto(),
            '',
        );
        const res = await sender.send(reqDto);
        expect(res.getJsonBody()).toEqual({ product: { one: 1, date: 'some date' } });

        mockAdapter?.restore();
    });
});
