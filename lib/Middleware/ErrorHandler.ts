import { NextFunction, Request, Response } from 'express';
import { createErrorResponse, createSuccessResponse } from '../Utils/Router';
import OnRepeatException from '../Exception/OnRepeatException';
import {
  get,
  getRepeaterMaxHops,
  getRepeatHops,
  HttpHeaders,
  REPEAT_INTERVAL,
  REPEAT_MAX_HOPS,
} from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';
import ResultCode from '../Utils/ResultCode';
import logger, { Logger } from '../Logger/Logger';

function hasRepeaterHeaders(headers: HttpHeaders): boolean {
  return getRepeatHops(headers) > 0
      || get(REPEAT_MAX_HOPS, headers) !== undefined
      || get(REPEAT_INTERVAL, headers) !== undefined;
}

function setNextHopHeaders(dto: ProcessDto): void {
  const currentHop = getRepeatHops(dto.headers);
  const maxHop = getRepeaterMaxHops(dto.headers);

  if (currentHop < maxHop) {
    dto.incrementRepeaterHop();
  } else {
    dto.setStopProcess(ResultCode.STOP_AND_FAILED, 'Last repeat try reached.');
    // TODO: lastRepeatCallback
  }

  logger.debug(
    `Repeater reached with settings: 
      CurrentHop: ${currentHop}, 
      Interval: ${get(REPEAT_INTERVAL, dto.headers)}, 
      MaxHops: ${maxHop}`,
    Logger.ctxFromDto(dto),
  );
}

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof OnRepeatException) {
    const dto = err.getDto();

    if (!hasRepeaterHeaders(dto.headers)) {
      // todo add load repeat settings from mongo
      dto.setRepeater(err.getInterval(), err.getMaxHops(), 0);
    }
    setNextHopHeaders(dto);

    createSuccessResponse(res, dto);
    next();
    return;
  }

  createErrorResponse(req, res, err);
  next();
}
