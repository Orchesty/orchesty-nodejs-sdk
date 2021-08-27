import { NextFunction, Request, Response } from 'express';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Utils/Router';
import OnRepeatException from '../Exception/OnRepeatException';
import {
  get,
  getRepeatHops,
  REPEAT_INTERVAL,
} from '../Utils/Headers';
import logger, { Logger } from '../Logger/Logger';

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const dto = createProcessDto(req);

  if (err instanceof OnRepeatException) {
    // todo add load repeat settings from mongo
    dto.setRepeater(err.getInterval(), err.getMaxHops(), err.message);

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
