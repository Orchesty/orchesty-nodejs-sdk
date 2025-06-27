import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';
import { tryJsonParse } from '../Utils/Json';

export default function bodyParser(req: Request, res: Response, next: NextFunction): void {
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => {
        req.body = data;
        logger.debug(
            `Incoming request: Method[${req.method}] Url[${req.url}]`,
            logger.createCtx(req, req.headers, tryJsonParse(req.body) ?? req.body),
        );

        next();
    });
}
