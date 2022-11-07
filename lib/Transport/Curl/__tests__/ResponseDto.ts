import ResponseDto from '../ResponseDto';

let responseDto: ResponseDto;
const jsonBody = { param1: 1, param2: 2 };

describe('test for ResponseDto', () => {
    beforeEach(() => {
        responseDto = new ResponseDto(JSON.stringify(jsonBody), 999, {}, Buffer.from(''), 'testReason');
    });

    it('getBody', () => {
        expect(responseDto.getBody()).toEqual(JSON.stringify(jsonBody));
    });

    it('getJsonBody', () => {
        expect(responseDto.getJsonBody()).toEqual({
            param1: 1,
            param2: 2,
        });
    });

    it('getReason', () => {
        expect(responseDto.getReason()).toEqual('testReason');
    });

    it('getResponseCode', () => {
        expect(responseDto.getResponseCode()).toEqual(999);
    });
});
