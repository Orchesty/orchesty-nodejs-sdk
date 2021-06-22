import RequestDto from '../RequestDto';
import HttpMethods from '../../HttpMethods';
import ProcessDTO from '../../../Utils/ProcessDTO';

describe('RequestDto tests', () => {
  const url = 'https://www.google.com';
  const method = HttpMethods.POST;
  const body = JSON.stringify({ test: 'test' });
  const header = { headerParam: 'headerParam' };
  const requestDto = new RequestDto(url, method, body, header);

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
  it('getMethod', () => {
    expect(requestDto.getTimeout()).toEqual(10000);
  });
  it('getUndefinedDebugInfo', () => {
    expect(requestDto.getDebugInfo()).toEqual(undefined);
  });
  it('getDebugInfo', () => {
    requestDto.setDebugInfo(new ProcessDTO());
    expect(requestDto.getDebugInfo()).toEqual(new ProcessDTO());
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
