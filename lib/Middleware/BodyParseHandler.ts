import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';

export default function bodyParser(req: Request, res: Response, next: NextFunction): void {
    let data = '';
    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => {
        req.body = data;

        logger.debug(`Incoming request: Method[${req.method}] Url[${req.url}] Headers[${JSON.stringify(req.headers)}] Body[${req.body}]`, req);

        next();
    });
}
