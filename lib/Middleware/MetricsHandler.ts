import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';
import { getCorrelationId, getNodeId } from '../Utils/Headers';
import Metrics, { IStartMetrics } from '../Metrics/Metrics';
import { container } from '../index';
import CoreServices from '../DIContainer/CoreServices';

async function afterResponse(
  req: Request,
  res: Response,
  next: NextFunction,
  startMetrics: IStartMetrics,
  sender: Metrics,
) {
  res.removeListener('finish', afterResponse);
  next();

  const times = Metrics.getTimes(startMetrics);
  await sender.sendProcessMetrics(
    times,
    getCorrelationId(req.headers),
    getNodeId(req.headers), getCorrelationId(req.headers),
  );
  logger.debug(`Total request duration: ${Number(times.requestDuration) / 1000000}ms`);
}

export default function metricsHandler(req: Request, res: Response, next: NextFunction): void {
  const startMetrics = Metrics.getCurrentMetrics();
  const sender = container.get(CoreServices.METRICS);
  res.on('finish', async () => {
    await afterResponse(req, res, next, startMetrics, sender);
  });
  next();
}
