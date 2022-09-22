import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import OnRepeatException from '../Exception/OnRepeatException';
import OnStopAndFailException from '../Exception/OnStopAndFailException';
import logger from '../Logger/Logger';
import NodeRepository from '../Storage/Mongodb/Document/NodeRepository';
import { getRepeatHops, NODE_ID, REPEAT_INTERVAL } from '../Utils/Headers';
import ResultCode from '../Utils/ResultCode';
import { createErrorResponse, createProcessDto, createSuccessResponse } from '../Utils/Router';

export default function errorHandler(nodeRepository: NodeRepository) {
    return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (res.headersSent) {
            next(err);
            return;
        }
        const dto = await createProcessDto(req);

        if (err instanceof OnRepeatException) {
            const node = await nodeRepository.findOne({ _id: new ObjectId(dto.getHeader(NODE_ID) ?? '') });
            const repeaterSettings = node?.getSystemConfigsFromString()?.repeater;
            if (repeaterSettings?.enabled) {
                dto.setRepeater(repeaterSettings.interval, repeaterSettings.hops, err.message);
            } else {
                dto.setRepeater(err.getInterval(), err.getMaxHops(), err.message);
            }

            logger.debug(
                `Repeater reached with settings: 
      CurrentHop: ${getRepeatHops(dto.getHeaders())}, 
      Interval: ${dto.getHeader(REPEAT_INTERVAL)}, 
      MaxHops: ${err.getMaxHops()}`,
                dto,
            );

            createSuccessResponse(res, dto);
            res.on('finish', () => {
                dto.setFree(true);
            });
            next();
            return;
        }
        if (err instanceof OnStopAndFailException) {
            logger.debug(err.message, dto);
            dto.setStopProcess(ResultCode.STOP_AND_FAILED, err.message);

            createSuccessResponse(res, dto);
            res.on('finish', () => {
                dto.setFree(true);
            });
            next();
            return;
        }

        createErrorResponse(req, res, dto, err);
        res.on('finish', () => {
            dto.setFree(true);
        });
        next();
    };
}
