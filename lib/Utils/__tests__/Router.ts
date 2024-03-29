import { Request, Response } from 'express';
import { NODE_ID } from '../Headers';
import ProcessDto from '../ProcessDto';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Router';

// Mock Request/Response of Express
function mockedRequest(): { body: string } {
    return {
        body: JSON.stringify({
            headers: { 'node-id': '123' },
            body: JSON.stringify({ body: 'aaa' }),
        }),
    };
}

function mockRequest(): Request {
    return mockedRequest() as unknown as Request;
}

function mockedResponse(
    status: () => void,
    hasHeader: () => void,
    getHeader: () => void,
    setHeader: () => void,
    json?: () => void,
    send?: () => void,
): Record<string, (() => void) | undefined> {
    return {
        status,
        hasHeader,
        getHeader,
        setHeader,
        json,
        send,
    };
}

function mockResponseFn(hasHeader: boolean): jest.Mock[] {
    const statusMock = jest.fn().mockReturnValue(false);
    const hasHeaderMock = jest.fn().mockReturnValue(hasHeader);
    const getHeaderMock = jest.fn().mockReturnValue(hasHeader);
    const setHeaderMock = jest.fn().mockReturnValue(false);
    const jsonMock = jest.fn().mockReturnValue(false);
    const sendMock = jest.fn().mockReturnValue(false);

    return [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock];
}

function mockResponse(
    status: () => void,
    hasHeader: () => void,
    getHeader: () => void,
    setHeader: () => void,
    json?: () => void,
    send?: () => void,
): Response {
    return mockedResponse(status, hasHeader, getHeader, setHeader, json, send) as unknown as Response;
}

describe('tests Router Utils', () => {
    it('createErrorResponse', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(false);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);

        createErrorResponse(mockRequest(), res, new ProcessDto(), new Error('err message'));
        expect(statusMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createErrorResponse with error without stackTrace', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(false);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);
        const err = new Error('err message');
        err.stack = undefined;

        createErrorResponse(mockRequest(), res, new ProcessDto(), err);
        expect(statusMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createErrorResponse with error & exist all headers', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(true);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);
        const err = new Error('err message');
        err.stack = undefined;

        createErrorResponse(mockRequest(), res, new ProcessDto(), err);
        expect(statusMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createErrorResponse with error & with header', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(true);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);
        const err = new Error('err message');
        const dto = new ProcessDto();
        dto.addHeader('authorization', 'bearer token');
        err.stack = undefined;
        createErrorResponse(mockRequest(), res, dto, err);
        expect(statusMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createErrorResponse without error', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(false);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);

        createErrorResponse(mockRequest(), res, new ProcessDto());
        expect(statusMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createSuccessResponse', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(false);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);
        const dto = new ProcessDto();
        dto.addHeader(NODE_ID, '123');

        createSuccessResponse(res, dto);
        expect(statusMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createSuccessResponse exist all headers', () => {
        const [statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock] = mockResponseFn(true);
        const res = mockResponse(statusMock, hasHeaderMock, getHeaderMock, setHeaderMock, jsonMock, sendMock);
        const dto = new ProcessDto();
        dto.addHeader(NODE_ID, '123');

        createSuccessResponse(res, dto);
        expect(statusMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('createProcessDto', async () => {
        const req = mockRequest();
        const dto = await createProcessDto(req, 'testApp');
        expect(dto.getHeader(NODE_ID)).toEqual('123');
        expect(dto.getJsonData()).toEqual({ body: 'aaa' });
        expect(dto.getCurrentApp()).toEqual('testApp');
    });
});
