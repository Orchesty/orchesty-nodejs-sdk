import { NextFunction, Request, Response } from 'express';
import { container } from '../index';
import logger from '../Logger/Logger';
import Metrics, { IStartMetrics } from '../Metrics/Metrics';
import { getCorrelationId, getNodeId } from '../Utils/Headers';

function afterResponse(
    req: Request,
    res: Response,
    next: NextFunction,
    startMetrics: IStartMetrics,
    sender: Metrics,
): void {
    res.removeListener('finish', afterResponse);
    next();

    const times = Metrics.getTimes(startMetrics);
    sender
        .sendProcessMetrics(
            times,
            getCorrelationId(req.headers),
            getNodeId(req.headers),
            getCorrelationId(req.headers),
        )
        .catch((e: unknown) => logger.error((e as { message: string })?.message ?? e, req));

    logger.debug(
        `Total request duration: ${times.requestDuration}ms for endpoint ${req.method}[${req.originalUrl}]`,
        logger.createCtx(req),
    );
}

export default function metricsHandler(req: Request, res: Response, next: NextFunction): void {
    const startMetrics = Metrics.getCurrentMetrics();
    const sender = container.get(Metrics);
    res.on('finish', () => {
        afterResponse(req, res, next, startMetrics, sender);
    });
    next();
}
