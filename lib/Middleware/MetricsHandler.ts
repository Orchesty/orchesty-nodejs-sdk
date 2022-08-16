import { NextFunction, Request, Response } from 'express';
import CoreServices from '../DIContainer/CoreServices';
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
    sender.sendProcessMetrics(
        times,
        getCorrelationId(req.headers),
        getNodeId(req.headers),
        getCorrelationId(req.headers),
    ).catch((e) => logger.error(e?.message ?? e, req));

    // eslint-disable-next-line max-len
    logger.debug(`Total request duration: ${times.requestDuration}ms for endpoint ${req.method}[${req.originalUrl}]`, req);
}

export default function metricsHandler(req: Request, res: Response, next: NextFunction): void {
    const startMetrics = Metrics.getCurrentMetrics();
    const sender = container.get<Metrics>(CoreServices.METRICS);
    res.on('finish', () => {
        afterResponse(req, res, next, startMetrics, sender);
    });
    next();
}
