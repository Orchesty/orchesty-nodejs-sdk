import { Headers } from 'node-fetch';
import ResponseDto from '../ResponseDto';

let responseDto: ResponseDto;
const jsonBody = { param1: 1, param2: 2 };

describe('test for ResponseDto', () => {
    beforeEach(() => {
        responseDto = new ResponseDto(JSON.stringify(jsonBody), 999, new Headers(), 'testReason');
    });

    it('getBody', () => {
        expect(responseDto.body).toEqual(JSON.stringify(jsonBody));
    });

    it('getJsonBody', () => {
        expect(responseDto.jsonBody).toEqual({
            param1: 1,
            param2: 2,
        });
    });

    it('getReason', () => {
        expect(responseDto.reason).toEqual('testReason');
    });

    it('getResponseCode', () => {
        expect(responseDto.responseCode).toEqual(999);
    });
});
