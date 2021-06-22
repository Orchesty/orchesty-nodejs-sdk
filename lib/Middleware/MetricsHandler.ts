import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';
import {
  getCurrentMetrics, getTimes, IStartMetrics, sendProcessMetrics,
} from '../Metrics/Metrics';
import { getCorrelationId, getNodeId } from '../Utils/Headers';

async function afterResponse(req: Request, res: Response, next: NextFunction, startMetrics: IStartMetrics) {
  res.removeListener('finish', afterResponse);
  next();

  const times = getTimes(startMetrics);
  await sendProcessMetrics(times, getCorrelationId(req.headers), getNodeId(req.headers), getCorrelationId(req.headers));
  logger.debug(`Total request duration: ${Number(times.requestDuration) / 1000000}ms`);
}

export default function metricsHandler(req: Request, res: Response, next: NextFunction): void {
  const startMetrics = getCurrentMetrics();
  res.on('finish', async () => { await afterResponse(req, res, next, startMetrics); });
  next();
}
