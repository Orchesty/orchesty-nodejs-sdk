import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Utils/Router';
import OnRepeatException from '../Exception/OnRepeatException';
import {
  get,
  getRepeatHops, NODE_ID,
  REPEAT_INTERVAL,
} from '../Utils/Headers';
import logger from '../Logger/Logger';
import NodeRepository from '../Storage/Mongodb/Document/NodeRepository';

export default function errorHandler(nodeRepository: NodeRepository) {
  return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (res.headersSent) {
      next(err);
      return;
    }
    const dto = await createProcessDto(req);

    if (err instanceof OnRepeatException) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const node = await nodeRepository.findOne({ _id: new ObjectId(dto.getHeader(NODE_ID) ?? '') });
      const repeaterSettings = node?.getSystemConfigsFromString()?.repeater;
      if (repeaterSettings?.enabled) {
        dto.setRepeater(repeaterSettings.interval, repeaterSettings.hops, err.message);
      } else {
        dto.setRepeater(err.getInterval(), err.getMaxHops(), err.message);
      }

      logger.debug(
        `Repeater reached with settings: 
      CurrentHop: ${getRepeatHops(dto.headers)}, 
      Interval: ${get(REPEAT_INTERVAL, dto.headers)}, 
      MaxHops: ${err.getMaxHops()}`,
        dto,
      );

      createSuccessResponse(res, dto);
      res.on('finish', () => {
        dto.free = true;
      });
      next();
      return;
    }

    createErrorResponse(req, res, dto, err);
    res.on('finish', () => {
      dto.free = true;
    });
    next();
  };
}
