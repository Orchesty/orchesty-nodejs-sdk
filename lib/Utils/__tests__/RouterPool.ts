import { NextFunction, Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { mockRouter } from '../../../test/TestAbstact';
import ConnectorRouter from '../../Connector/ConnectorRouter';
import OnRepeatException from '../../Exception/OnRepeatException';
import errorHandler from '../../Middleware/ErrorHandler';
import NodeRepository from '../../Storage/Database/Document/NodeRepository';
import ProcessDto from '../ProcessDto';
import { createProcessDto } from '../Router';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

interface IFakeResponse extends EventEmitter {
    closed: boolean;
    headersSent: boolean;
    status: jest.Mock;
    setHeader: jest.Mock;
    send: jest.Mock;
}

function mockRequest(body = JSON.stringify({ headers: { 'node-id': '123' }, body: '{}' })): Request {
    return { body, params: { name: 'test' } } as unknown as Request;
}

function mockResponse(closed = false): IFakeResponse {
    return Object.assign(new EventEmitter(), {
        closed,
        headersSent: false,
        status: jest.fn(),
        setHeader: jest.fn(),
        send: jest.fn(),
    });
}

function mockConnectorRoute(processAction: jest.Mock): { handler: RouteHandler; router: ConnectorRouter } {
    const mock = mockRouter();
    jest.mocked(mock.loader.get).mockReturnValue({
        processAction,
        getApplicationName: (): string => 'testApp',
    } as never);
    const router = new ConnectorRouter(mock.express, mock.loader);

    return { handler: mock.postFn.mock.calls[0][0] as RouteHandler, router };
}

async function probePool(): Promise<ProcessDto> {
    const dto = await createProcessDto(mockRequest());
    dto.setFree(true);

    return dto;
}

describe('tests ProcessDto pool handling', () => {
    it('malformed body does not take an object from the pool', async () => {
        const probe = await probePool();

        await expect(createProcessDto(mockRequest('not a json'))).rejects.toThrow(SyntaxError);

        const reused = await createProcessDto(mockRequest());

        expect(reused).toBe(probe);

        reused.setFree(true);
    });

    it('failed node returns its object to the pool once the response is over', async () => {
        const probe = await probePool();
        const err = new Error('node failed');
        const { handler } = mockConnectorRoute(jest.fn().mockRejectedValue(err));
        const res = mockResponse();
        const next = jest.fn();

        await handler(mockRequest(), res as unknown as Response, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(probe.isFree()).toBeFalsy();

        res.emit('close');

        expect(probe.isFree()).toBeTruthy();

        const reused = await createProcessDto(mockRequest());

        expect(reused).toBe(probe);

        reused.setFree(true);
    });

    it('failed node returns its object immediately when the client is already gone', async () => {
        const probe = await probePool();
        const { handler } = mockConnectorRoute(jest.fn().mockRejectedValue(new Error('node failed')));
        const res = mockResponse(true);

        await handler(mockRequest(), res as unknown as Response, jest.fn());

        expect(probe.isFree()).toBeTruthy();
        expect(res.listenerCount('close')).toEqual(0);
    });

    it('successful node returns its object on close, not on finish', async () => {
        const probe = await probePool();
        const { handler } = mockConnectorRoute(jest.fn().mockImplementation((dto: ProcessDto) => dto));
        const res = mockResponse();

        await handler(mockRequest(), res as unknown as Response, jest.fn());

        res.emit('finish');

        expect(probe.isFree()).toBeFalsy();

        res.emit('close');

        expect(probe.isFree()).toBeTruthy();
    });

    it('node returning a different object still returns the pooled one', async () => {
        const probe = await probePool();
        const { handler } = mockConnectorRoute(jest.fn().mockResolvedValue(new ProcessDto()));
        const res = mockResponse();

        await handler(mockRequest(), res as unknown as Response, jest.fn());

        expect(probe.isFree()).toBeFalsy();

        res.emit('close');

        expect(probe.isFree()).toBeTruthy();

        const reused = await createProcessDto(mockRequest());

        expect(reused).toBe(probe);

        reused.setFree(true);
    });

    it('error handler returns its object to the pool when it fails itself', async () => {
        const probe = await probePool();
        const failure = new Error('worker-api is down');
        const repository = { findOne: jest.fn().mockRejectedValue(failure) } as unknown as NodeRepository;
        const next = jest.fn();

        await errorHandler(repository)(
            new OnRepeatException(30, 2, 'repeat me'),
            mockRequest(),
            mockResponse() as unknown as Response,
            next,
        );

        expect(next).toHaveBeenCalledWith(failure);
        expect(probe.isFree()).toBeTruthy();
    });
});
