import { Mutex } from 'async-mutex';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { appOptions } from '../Config/Config';
import logger from '../Logger/Logger';
import AProcessDto from './AProcessDto';
import BatchProcessDto from './BatchProcessDto';
import { IHttpHeaders, RESULT_CODE, RESULT_DETAIL, RESULT_MESSAGE } from './Headers';
import ProcessDto from './ProcessDto';
import ResultCode, { isSuccessResultCode } from './ResultCode';

interface IErrorResponse {
    result: string;
    message: string;
}

export function formatError(e: Error): IErrorResponse {
    return { result: 'error', message: e.message };
}

interface IBridgeRequestDto {
    body: string;
    headers: IHttpHeaders;
}

function logResponseProcess(dto: AProcessDto): void {
    if (isSuccessResultCode(parseInt(dto.getHeader(RESULT_CODE, '0') as string, 10))) {
        logger.info(
            `Request successfully processed. Message: [${dto.getHeader(RESULT_MESSAGE) ?? ''}]`,
            dto,
        );
    } else {
        logger.error(
            `Request process failed. Message: [${dto.getHeader(RESULT_MESSAGE) ?? ''}]`,
            dto,
        );
    }
}

export function createApiErrorResponse(req: Request, res: Response, e?: unknown): void {
    res.status(500);
    let message = 'Error occurred: unknown reason';

    let stack = (e as { message?: string; stack?: string })?.stack;
    if (appOptions.debug) {
        stack = stack ? JSON.stringify(stack.replace(/\r?\n|\r/g, '')) : undefined;
        stack = `, Stack: ${stack}`;
    }

    const detail = (e as { message?: string; stack?: string })?.message;
    if (detail) {
        res.status(400);
        message = `Error occurred: ${detail}${stack}`;
    }

    res.setHeader('Content-Type', 'application/json');
    logger.error(`Request process failed. Message: [${message}]`, {});
    res.send(JSON.stringify({ status: 'Error', message }));
}

export function createErrorResponse(req: Request, res: Response, _dto: AProcessDto, e?: Error): void {
    const dto = _dto;
    res.status(500);

    let message = 'Error occurred: unknown reason';

    if (!(RESULT_CODE in dto.getHeaders())) {
        dto.addHeader(RESULT_CODE, ResultCode.STOP_AND_FAILED.toString());
    }

    if (e) {
        res.status(400);
        message = `Error occurred: ${e.message}`;

        if (appOptions.debug && !dto.getHeader(RESULT_DETAIL)) {
            dto.addHeader(RESULT_DETAIL, e.stack === undefined ? '' : JSON.stringify(e.stack.replace(/\r?\n|\r/g, '')));
        }
    }

    const msg = message.replace(/\r?\n|\r/g, '');
    if (!(RESULT_MESSAGE in dto.getHeaders())) {
        dto.addHeader(RESULT_MESSAGE, msg);
    } else {
        dto.addHeader(RESULT_MESSAGE, `Error: ${msg}, Original result: ${dto.getHeader(RESULT_MESSAGE)}`);
    }

    res.setHeader('Content-Type', 'application/json');
    logResponseProcess(dto);
    res.send(JSON.stringify({
        body: dto.getBridgeData(),
        headers: dto.getHeaders(),
    } as IBridgeRequestDto));
}

export function createSuccessResponse(res: Response, _dto: AProcessDto): void {
    const dto = _dto;
    res.status(StatusCodes.OK);

    if (!(RESULT_CODE in dto.getHeaders())) {
        dto.addHeader(RESULT_CODE, ResultCode.SUCCESS.toString());
    }

    if (!(RESULT_MESSAGE in dto.getHeaders())) {
        dto.addHeader(RESULT_MESSAGE, 'Processed successfully.');
    }

    res.setHeader('Content-Type', 'application/json');
    logResponseProcess(dto);
    res.send(JSON.stringify({
        body: dto.getBridgeData(),
        headers: dto.getHeaders(),
    } as IBridgeRequestDto));
}

const mutex = new Mutex();
const dtoPool: ProcessDto[] = new Array(100).fill(new ProcessDto());

const batchMutex = new Mutex();
const batchDtoPool: BatchProcessDto[] = new Array(100).fill(new BatchProcessDto());

async function getFreeDto(): Promise<ProcessDto> {
    // Should CPU still be a concern, implement linked list for faster search
    // In case of Memory concern, limit maximum pool size and await for free objects
    return mutex.runExclusive(() => {
        for (const dto of dtoPool) {
            if (dto.isFree()) {
                dto.setFree(false);

                return dto;
            }
        }

        const dto = new ProcessDto();
        dto.setFree(false);
        dtoPool.push(dto);

        return dto;
    });
}

async function getFreeBatchDto(): Promise<BatchProcessDto> {
    // Should CPU still be a concern, implement linked list for faster search
    // In case of Memory concern, limit maximum pool size and await for free objects
    return batchMutex.runExclusive(() => {
        for (const batchDto of batchDtoPool) {
            if (batchDto.isFree()) {
                batchDto.setFree(false);

                return batchDto;
            }
        }

        const batchDto = new BatchProcessDto();
        batchDto.setFree(false);
        batchDtoPool.push(batchDto);

        return batchDto;
    });
}

export async function createProcessDto(req: Request, appName = ''): Promise<ProcessDto> {
    const dto = await getFreeDto();
    const parsed: IBridgeRequestDto = JSON.parse(req.body || '{}');

    dto.setData(parsed.body || '{}');
    dto.setHeaders(parsed.headers || {});
    dto.setCurrentApp(appName);

    return dto;
}

export async function createBatchProcessDto(req: Request, appName: string): Promise<BatchProcessDto> {
    const dto = await getFreeBatchDto();
    const parsed: IBridgeRequestDto = JSON.parse(req.body || '{}');

    dto.setBridgeData(parsed.body || '{}');
    dto.setHeaders(parsed.headers || {});
    dto.setCurrentApp(appName);

    return dto;
}
