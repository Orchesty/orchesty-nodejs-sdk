import { NextFunction, Request, Response } from 'express';
import OnRepeatException from '../Exception/OnRepeatException';
import OnStopAndFailException from '../Exception/OnStopAndFailException';
import logger from '../Logger/Logger';
import NodeRepository from '../Storage/Database/Document/NodeRepository';
import { getRepeatHops, NODE_ID, REPEAT_INTERVAL } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';
import ResultCode from '../Utils/ResultCode';
import { createErrorResponse, createProcessDto, createSuccessResponse, releaseDtoOnClose } from '../Utils/Router';

export default function errorHandler(nodeRepository: NodeRepository) {
    return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (res.headersSent) {
            next(err);
            return;
        }

        let acquiredProcessDto: ProcessDto | undefined;

        try {
            acquiredProcessDto = await createProcessDto(req);
            const dto = acquiredProcessDto;

            if (err instanceof OnRepeatException) {
                const node = await nodeRepository.findOne({ ids: [dto.getHeader(NODE_ID) ?? ''] });
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
                releaseDtoOnClose(res, dto);

                acquiredProcessDto = undefined;
                next();
                return;
            }

            if (err instanceof OnStopAndFailException) {
                logger.error(err.message, dto, false, err);
                dto.setStopProcess(ResultCode.STOP_AND_FAILED, err.message);

                createSuccessResponse(res, dto);
                releaseDtoOnClose(res, dto);

                acquiredProcessDto = undefined;
                next();
                return;
            }

            createErrorResponse(req, res, dto, err);
            releaseDtoOnClose(res, dto);

            acquiredProcessDto = undefined;
            next();
        } catch (e) {
            acquiredProcessDto?.setFree(true);
            next(e);
        }
    };
}
