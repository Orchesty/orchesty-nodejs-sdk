import RequestDto from '../RequestDto';
import HttpMethods from '../../HttpMethods';
import ProcessDto from '../../../Utils/ProcessDto';

describe('RequestDto tests', () => {
  const url = 'https://www.google.com';
  const method = HttpMethods.POST;
  const body = JSON.stringify({ test: 'test' });
  const header = { headerParam: 'headerParam' };
  const requestDto = new RequestDto(url, method, body, header);

  it('getBody', () => {
    expect(requestDto.body).toEqual(body);
  });
  it('getHeader', () => {
    expect(requestDto.headers).toEqual(header);
  });
  it('getMethod', () => {
    expect(requestDto.method).toEqual(method);
  });
  it('getUrl', () => {
    expect(requestDto.url).toEqual(url);
  });
  it('getMethod', () => {
    expect(requestDto.timeout).toEqual(30000);
  });
  it('getUndefinedDebugInfo', () => {
    expect(requestDto.debugInfo).toEqual(undefined);
  });
  it('getDebugInfo', () => {
    requestDto.debugInfo = new ProcessDto();
    expect(requestDto.debugInfo).toEqual(new ProcessDto());
  });
  it('setBody', () => {
    const newBody = JSON.stringify({ newBody: 'newBody' });
    requestDto.body = newBody;
    expect(requestDto.body).toEqual(newBody);
  });
  it('setHeaders', () => {
    const newHeader = { newHeaderParam: 'newHeaderParam' };
    requestDto.headers = newHeader;
    expect(requestDto.headers).toEqual(newHeader);
  });
  it('setMethod', () => {
    const newMethod = HttpMethods.PUT;
    requestDto.method = newMethod;
    expect(requestDto.method).toEqual(newMethod);
  });
  it('setUrl', () => {
    const newUrl = 'https://test.cz';
    requestDto.url = newUrl;
    expect(requestDto.url).toEqual(newUrl);
  });
  it('setTimeout', () => {
    const newTimeout = 5000;
    requestDto.timeout = newTimeout;
    expect(requestDto.timeout).toEqual(newTimeout);
  });
});
