import { Mutex } from 'async-mutex';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AProcessDto from './AProcessDto';
import BatchProcessDto from './BatchProcessDto';
import ProcessDto from './ProcessDto';
import logger from '../Logger/Logger';
import {
  HttpHeaders, RESULT_CODE, RESULT_DETAIL, RESULT_MESSAGE,
} from './Headers';
import ResultCode, { isSuccessResultCode } from './ResultCode';
import { appOptions } from '../Config/Config';

interface IErrorResponse {
  result: string;
  message: string;
}

export function formatError(e: Error): IErrorResponse {
  return { result: 'error', message: e.message };
}

interface IBridgeRequestDto {
  body: string;
  headers: HttpHeaders;
}

function logResponseProcess(dto: AProcessDto): void {
  if (isSuccessResultCode(parseInt(dto.getHeader(RESULT_CODE, '0') as string, 10))) {
    logger.info(
      `Request successfully processed. Message: [${dto.getHeader(RESULT_MESSAGE)}]`,
      dto,
    );
  } else {
    logger.error(
      `Request process failed. Message: [${dto.getHeader(RESULT_MESSAGE)}]`,
      dto,
    );
  }
}

export function createErrorResponse(req: Request, res: Response, _dto: AProcessDto, e?: Error): void {
  const dto = _dto;
  res.status(500);

  let message = 'Error occurred: unknown reason';

  if (!(RESULT_CODE in dto.headers)) {
    dto.headers[RESULT_CODE] = ResultCode.STOP_AND_FAILED.toString();
  }

  if (e) {
    res.status(400);
    message = `Error occurred: ${e.message}`;

    if (appOptions.debug && !dto.getHeader(RESULT_DETAIL)) {
      dto.headers[RESULT_DETAIL] = e.stack === undefined ? '' : JSON.stringify(e.stack.replace(/\r?\n|\r/g, ''));
    }
  }

  const msg = message.replace(/\r?\n|\r/g, '');
  if (!(RESULT_MESSAGE in dto.headers)) {
    dto.headers[RESULT_MESSAGE] = msg;
  } else {
    dto.headers[RESULT_MESSAGE] = `Error: ${msg}, Original result: ${dto.getHeader(RESULT_MESSAGE)}`;
  }

  res.setHeader('Content-Type', 'application/json');
  logResponseProcess(dto);
  res.send(JSON.stringify({
    body: dto.getBridgeData(),
    headers: dto.headers,
  } as IBridgeRequestDto));
}

export function createSuccessResponse(res: Response, _dto: AProcessDto): void {
  const dto = _dto;
  res.status(StatusCodes.OK);

  if (!(RESULT_CODE in dto.headers)) {
    dto.headers[RESULT_CODE] = ResultCode.SUCCESS.toString();
  }

  if (!(RESULT_MESSAGE in dto.headers)) {
    dto.headers[RESULT_MESSAGE] = 'Processed successfully.';
  }

  res.setHeader('Content-Type', 'application/json');
  logResponseProcess(dto);
  res.send(JSON.stringify({
    body: dto.getBridgeData(),
    headers: dto.headers,
  } as IBridgeRequestDto));
}

const mutex = new Mutex();
const dtoPool = new Array(100).fill(0);
for (let i = 0; i < 100; i += 1) {
  dtoPool[i] = new ProcessDto();
}

const batchMutex = new Mutex();
const batchDtoPool = new Array(100).fill(0);
for (let i = 0; i < 100; i += 1) {
  batchDtoPool[i] = new BatchProcessDto();
}

async function getFreeDto(): Promise<ProcessDto> {
  // Should CPU still be a concern, implement linked list for faster search
  // In case of Memory concern, limit maximum pool size and await for free objects
  return mutex.runExclusive(() => {
    for (let i = 0; i < dtoPool.length; i += 1) {
      if (dtoPool[i].free) {
        dtoPool[i].free = false;

        return dtoPool[i];
      }
    }

    const dto = new ProcessDto();
    dto.free = false;
    dtoPool.push(dto);

    return dto;
  });
}

async function getFreeBatchDto(): Promise<BatchProcessDto> {
  // Should CPU still be a concern, implement linked list for faster search
  // In case of Memory concern, limit maximum pool size and await for free objects
  return batchMutex.runExclusive(() => {
    for (let i = 0; i < batchDtoPool.length; i += 1) {
      if (batchDtoPool[i].free) {
        batchDtoPool[i].free = false;

        return batchDtoPool[i];
      }
    }

    const dto = new BatchProcessDto();
    dto.free = false;
    batchDtoPool.push(dto);

    return dto;
  });
}

export async function createProcessDto(req: Request): Promise<ProcessDto> {
  const dto = await getFreeDto();
  const parsed: IBridgeRequestDto = JSON.parse(req.body || '{}');

  dto.data = parsed.body || '{}';
  dto.headers = parsed.headers || {};

  return dto;
}

export async function createBatchProcessDto(req: Request): Promise<BatchProcessDto> {
  const dto = await getFreeBatchDto();
  const parsed: IBridgeRequestDto = JSON.parse(req.body || '{}');

  dto.setBridgeData(parsed.body || '{}');
  dto.headers = parsed.headers || {};

  return dto;
}
