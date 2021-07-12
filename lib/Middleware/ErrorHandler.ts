import { NextFunction, Request, Response } from 'express';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Utils/Router';
import OnRepeatException from '../Exception/OnRepeatException';
import {
  get,
  getRepeatHops,
  HttpHeaders,
  REPEAT_INTERVAL,
  REPEAT_MAX_HOPS,
} from '../Utils/Headers';
import logger, { Logger } from '../Logger/Logger';

function hasRepeaterHeaders(headers: HttpHeaders): boolean {
  return getRepeatHops(headers) > 0
    || get(REPEAT_MAX_HOPS, headers) !== undefined
    || get(REPEAT_INTERVAL, headers) !== undefined;
}

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const dto = createProcessDto(req);

  if (err instanceof OnRepeatException) {
    if (!hasRepeaterHeaders(dto.headers)) {
      // todo add load repeat settings from mongo
      dto.setRepeater(err.getInterval(), err.getMaxHops());
    }

    logger.debug(
      `Repeater reached with settings: 
      CurrentHop: ${getRepeatHops(dto.headers)}, 
      Interval: ${get(REPEAT_INTERVAL, dto.headers)}, 
      MaxHops: ${err.getMaxHops()}`,
      Logger.ctxFromDto(dto),
    );

    createSuccessResponse(res, dto);
    next();
    return;
  }

  createErrorResponse(req, res, dto, err);
  next();
}
