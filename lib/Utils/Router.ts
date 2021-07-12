import { Request, Response } from 'express';
import ProcessDto from './ProcessDto';
import logger, { Logger } from '../Logger/Logger';
import {
  createKey, RESULT_CODE, RESULT_DETAIL, RESULT_MESSAGE,
} from './Headers';
import ResultCode from './ResultCode';
import { appOptions } from '../Config/Config';

interface IErrorResponse {
  result: string;
  message: string;
}

export function formatError(e: Error): IErrorResponse {
  return { result: 'error', message: e.message };
}

export function createErrorResponse(req: Request, res: Response, dto: ProcessDto, e?: Error): void {
  res.status(500);
  Object.entries(dto.headers).forEach(([key, value]) => {
    res.setHeader(key, String(value));
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
      res.setHeader(
        createKey(RESULT_DETAIL),
        e.stack === undefined ? '' : JSON.stringify(e.stack.replace(/\r?\n|\r/g, '')),
      );
    }
  }

  if (!res.hasHeader(createKey(RESULT_MESSAGE))) {
    res.setHeader(createKey(RESULT_MESSAGE), message);
  }

  logger.error(message, Logger.ctxFromReq(req));
  res.json(responseBody);
}

export function createSuccessResponse(res: Response, dto: ProcessDto): void {
  res.status(200);

  Object.entries(dto.headers).forEach(([key, value]) => {
    res.setHeader(key, String(value));
  });

  if (!res.hasHeader(createKey(RESULT_CODE))) {
    res.setHeader(createKey(RESULT_CODE), ResultCode.SUCCESS);
  }

  if (!res.hasHeader(createKey(RESULT_MESSAGE))) {
    res.setHeader(createKey(RESULT_MESSAGE), 'Processed successfully.');
  }

  logger.debug('Request successfully processed.', Logger.ctxFromDto(dto));
  res.send(dto.data);
}

export function createProcessDto(req: Request): ProcessDto {
  const dto = new ProcessDto();

  dto.data = req.body;
  dto.headers = req.headers;

  return dto;
}
