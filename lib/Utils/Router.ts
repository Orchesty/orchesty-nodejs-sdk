import { Mutex } from 'async-mutex';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ProcessDto from './ProcessDto';
import logger from '../Logger/Logger';
import {
  createKey, RESULT_CODE, RESULT_DETAIL, RESULT_MESSAGE,
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

function logResponseProcess(res: Response, dto: ProcessDto) {
  if (isSuccessResultCode(res.getHeader(createKey(RESULT_CODE)) as number ?? 0)) {
    logger.info(
      `Request successfully processed. Message: [${res.getHeader(createKey(RESULT_MESSAGE))}]`,
      dto,
    );
  } else {
    logger.error(
      `Request process failed. Message: [${res.getHeader(createKey(RESULT_MESSAGE))}]`,
      dto,
    );
  }
}

export function createErrorResponse(req: Request, res: Response, dto: ProcessDto, e?: Error): void {
  res.status(500);

  Object.entries(dto.headers).forEach(([key, value]) => {
    try {
      res.setHeader(key, String(value));
    } catch (ex) {
      logger.error(`Can't set header [${key}:${value}]`, dto);
    }
  });

  let message = 'Error occurred: unknown reason';
  let responseBody = { result: 'Unknown error', message: 'Unknown error occurred.' };

  if (!res.hasHeader(createKey(RESULT_CODE))) {
    res.setHeader(createKey(RESULT_CODE), ResultCode.STOP_AND_FAILED);
  }

  if (e) {
    res.status(400);
    message = `Error occurred: ${e.message}`;
    responseBody = formatError(e);

    if (appOptions.debug && !res.hasHeader(createKey(RESULT_DETAIL))) {
      try {
        res.setHeader(
          createKey(RESULT_DETAIL),
          e.stack === undefined ? '' : JSON.stringify(e.stack.replace(/\r?\n|\r/g, '')),
        );
      } catch (ex) {
        logger.error(
          // eslint-disable-next-line max-len
          `Can't set header [${createKey(RESULT_DETAIL)}:${JSON.stringify(e.stack === undefined ? '' : e.stack.replace(/\r?\n|\r/g, ''))}]`,
          dto,
        );
      }
    }
  }

  try {
    if (!res.hasHeader(createKey(RESULT_MESSAGE))) {
      res.setHeader(createKey(RESULT_MESSAGE), message.replace(/\r?\n|\r/g, ''));
    } else {
      res.setHeader(
        createKey(RESULT_MESSAGE),
        `Error: ${message.replace(/\r?\n|\r/g, '')}, Original result: ${res.getHeader(RESULT_MESSAGE)}`,
      );
    }
  } catch (ex) {
    logger.error(`Can't set header [${createKey(RESULT_MESSAGE)}:${message}]`, dto);
  }

  logResponseProcess(res, dto);
  res.json(responseBody);
}

export function createSuccessResponse(res: Response, dto: ProcessDto): void {
  res.status(StatusCodes.OK);

  Object.entries(dto.headers).forEach(([key, value]) => {
    res.setHeader(key, String(value));
  });

  if (!res.hasHeader(createKey(RESULT_CODE))) {
    res.setHeader(createKey(RESULT_CODE), ResultCode.SUCCESS);
  }

  if (!res.hasHeader(createKey(RESULT_MESSAGE))) {
    res.setHeader(createKey(RESULT_MESSAGE), 'Processed successfully.');
  }

  logResponseProcess(res, dto);
  res.send(dto.data);
}

const mutex = new Mutex();
const dtoPool = new Array(100).fill(0);
for (let i = 0; i < 100; i += 1) {
  dtoPool[i] = new ProcessDto();
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

export async function createProcessDto(req: Request): Promise<ProcessDto> {
  const dto = await getFreeDto();

  dto.data = req.body;
  dto.headers = req.headers;

  return dto;
}
