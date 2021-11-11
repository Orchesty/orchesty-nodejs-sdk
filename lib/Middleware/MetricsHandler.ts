import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';
import { getCorrelationId, getNodeId } from '../Utils/Headers';
import Metrics, { IStartMetrics } from '../Metrics/Metrics';
import { container } from '../index';
import CoreServices from '../DIContainer/CoreServices';

function afterResponse(
  req: Request,
  res: Response,
  next: NextFunction,
  startMetrics: IStartMetrics,
  sender: Metrics,
) {
  res.removeListener('finish', afterResponse);
  next();

  const times = Metrics.getTimes(startMetrics);
  sender.sendProcessMetrics(
    times,
    getCorrelationId(req.headers),
    getNodeId(req.headers),
    getCorrelationId(req.headers),
  ).catch((e) => (logger.error(e?.message ?? e)));

  // eslint-disable-next-line max-len
  logger.debug(`Total request duration: ${times.requestDuration}ms for endpoint ${req.method}[${req.originalUrl}]`, logger.ctxFromReq(req));
}

export default function metricsHandler(req: Request, res: Response, next: NextFunction): void {
  const startMetrics = Metrics.getCurrentMetrics();
  const sender = container.get(CoreServices.METRICS);
  res.on('finish', () => {
    afterResponse(req, res, next, startMetrics, sender);
  });
  next();
}
