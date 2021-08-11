import { Request, Response } from 'express';
import { mocked } from 'ts-jest/utils';
import faker from 'faker';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Router';
import { Logger } from '../../Logger/Logger';
import ProcessDto from '../ProcessDto';
import { NODE_ID } from '../Headers';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

// Mock Logger.ctxFromReq static method
const mockedLogger = mocked(Logger, true);
mockedLogger.ctxFromReq = jest.fn();
mockedLogger.ctxFromDto = jest.fn();

// Mock Request/Response of Express
const mockedRequest = () => ({
  headers: { 'pf-node-id': '123' },
  body: '{"body": "aaa"}',
});

function mockRequest(): Request {
  return mockedRequest() as unknown as Request;
}

const mockedResponse = (
  status: () => void, hasHeader: () => void, setHeader: () => void, json?: () => void, send?: () => void,
) => ({
  status,
  hasHeader,
  setHeader,
  json,
  send,
});

function mockResponseFn(hasHeader: boolean) {
  const statusMock = jest.fn().mockReturnValue(false);
  const hasHeaderMock = jest.fn().mockReturnValue(hasHeader);
  const setHeaderMock = jest.fn().mockReturnValue(false);
  const jsonMock = jest.fn().mockReturnValue(false);
  const sendMock = jest.fn().mockReturnValue(false);

  return [statusMock, hasHeaderMock, setHeaderMock, jsonMock, sendMock];
}

function mockResponse(
  status: () => void, hasHeader: () => void, setHeader: () => void, json?: () => void, send?: () => void,
) {
  return mockedResponse(status, hasHeader, setHeader, json, send) as unknown as Response;
}

describe('tests Router Utils', () => {
  it('createErrorResponse', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock] = mockResponseFn(false);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock);

    createErrorResponse(mockRequest(), res, new ProcessDto(), new Error('err message'));
    expect(statusMock).toBeCalledTimes(2);
    expect(jsonMock).toBeCalledTimes(1);
    expect(hasHeaderMock).toBeCalledTimes(3);
    expect(setHeaderMock).toBeCalledTimes(3);
  });

  it('createErrorResponse with error without stackTrace', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock] = mockResponseFn(false);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock);
    const err = new Error('err message');
    err.stack = undefined;

    createErrorResponse(mockRequest(), res, new ProcessDto(), err);
    expect(statusMock).toBeCalledTimes(2);
    expect(jsonMock).toBeCalledTimes(1);
    expect(hasHeaderMock).toBeCalledTimes(3);
    expect(setHeaderMock).toBeCalledTimes(3);
  });

  it('createErrorResponse with error & exist all headers', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock] = mockResponseFn(true);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock);
    const err = new Error('err message');
    err.stack = undefined;

    createErrorResponse(mockRequest(), res, new ProcessDto(), err);
    expect(statusMock).toBeCalledTimes(2);
    expect(jsonMock).toBeCalledTimes(1);
    expect(hasHeaderMock).toBeCalledTimes(3);
    expect(setHeaderMock).toBeCalledTimes(0);
  });

  it('createErrorResponse with error & with header', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock] = mockResponseFn(true);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock);
    const err = new Error('err message');
    const dto = new ProcessDto();
    dto.addHeader('authorization', `bearer ${faker.internet.password()}`);
    err.stack = undefined;
    createErrorResponse(mockRequest(), res, dto, err);
    expect(statusMock).toBeCalledTimes(2);
    expect(jsonMock).toBeCalledTimes(1);
    expect(hasHeaderMock).toBeCalledTimes(3);
    expect(setHeaderMock).toBeCalledTimes(1);
  });

  it('createErrorResponse without error', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock] = mockResponseFn(false);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock);

    createErrorResponse(mockRequest(), res, new ProcessDto());
    expect(statusMock).toBeCalledTimes(1);
    expect(jsonMock).toBeCalledTimes(1);
    expect(hasHeaderMock).toBeCalledTimes(2);
    expect(setHeaderMock).toBeCalledTimes(2);
  });

  it('createSuccessResponse', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(false);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock, sendMock);
    const dto = new ProcessDto();
    dto.addHeader(NODE_ID, '123');

    createSuccessResponse(res, dto);
    expect(statusMock).toBeCalledTimes(1);
    expect(jsonMock).toBeCalledTimes(0);
    expect(hasHeaderMock).toBeCalledTimes(2);
    expect(setHeaderMock).toBeCalledTimes(3);
  });

  it('createSuccessResponse exist all headers', () => {
    const [statusMock, hasHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(true);
    const res = mockResponse(statusMock, hasHeaderMock, setHeaderMock, jsonMock, sendMock);
    const dto = new ProcessDto();
    dto.addHeader(NODE_ID, '123');

    createSuccessResponse(res, dto);
    expect(statusMock).toBeCalledTimes(1);
    expect(jsonMock).toBeCalledTimes(0);
    expect(hasHeaderMock).toBeCalledTimes(2);
    expect(setHeaderMock).toBeCalledTimes(1);
  });

  it('createProcessDto', () => {
    const req = mockRequest();
    const dto = createProcessDto(req);
    expect(dto.getHeader(NODE_ID)).toEqual('123');
    expect(dto.jsonData).toEqual({ body: 'aaa' });
  });
});
