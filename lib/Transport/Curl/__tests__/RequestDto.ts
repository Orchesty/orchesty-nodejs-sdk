import { CommonHeaders } from '../../../Utils/Headers';
import ProcessDto from '../../../Utils/ProcessDto';
import { HttpMethods } from '../../HttpMethods';
import RequestDto from '../RequestDto';

describe('RequestDto tests', () => {
    const url = 'https://www.google.com';
    const method = HttpMethods.POST;
    const body = JSON.stringify({ test: 'test' });
    const header = { headerParam: 'headerParam' };
    const requestDto = new RequestDto(url, method, new ProcessDto(), body, header);

    it('getBody', () => {
        expect(requestDto.getBody()).toEqual(body);
    });
    it('getHeader', () => {
        expect(requestDto.getHeaders()).toEqual(header);
    });
    it('getMethod', () => {
        expect(requestDto.getMethod()).toEqual(method);
    });
    it('getUrl', () => {
        expect(requestDto.getUrl()).toEqual(url);
    });
    it('getTimeout', () => {
        expect(requestDto.getTimeout()).toEqual(30000);
    });
    it('getDebugInfo', () => {
        requestDto.setDebugInfo(new ProcessDto());
        expect(requestDto.getDebugInfo()).toEqual(new ProcessDto());
    });
    it('setBody', () => {
        const newBody = JSON.stringify({ newBody: 'newBody' });
        requestDto.setBody(newBody);
        expect(requestDto.getBody()).toEqual(newBody);
    });
    it('setHeaders', () => {
        const newHeader = { newHeaderParam: 'newHeaderParam' };
        requestDto.setHeaders(newHeader);
        expect(requestDto.getHeaders()).toEqual(newHeader);
    });
    it('addHeaders', () => {
        const newHeaders = { [CommonHeaders.CONTENT_TYPE]: 'text' };
        requestDto.addHeaders(newHeaders);

        expect(requestDto.getHeaders()).toEqual({ ...newHeaders, ...{ newHeaderParam: 'newHeaderParam' } });
    });
    it('setMethod', () => {
        const newMethod = HttpMethods.PUT;
        requestDto.setMethod(newMethod);
        expect(requestDto.getMethod()).toEqual(newMethod);
    });
    it('setUrl', () => {
        const newUrl = 'https://test.cz';
        requestDto.setUrl(newUrl);
        expect(requestDto.getUrl()).toEqual(newUrl);
    });
    it('setTimeout', () => {
        const newTimeout = 5000;
        requestDto.setTimeout(newTimeout);
        expect(requestDto.getTimeout()).toEqual(newTimeout);
    });
});
