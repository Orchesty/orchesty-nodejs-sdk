import { NextFunction, Request, Response } from 'express';
import logger from '../Logger/Logger';
import { tryJsonParse } from '../Utils/Json';

export default function bodyParser(req: Request, res: Response, next: NextFunction): void {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
        req.body = Buffer.concat(chunks).toString('utf8');
        logger.info(
            `Incoming request: Method[${req.method}] Url[${req.url}]`,
            logger.createCtx(req, req.headers, tryJsonParse(req.body) ?? req.body),
            false,
        );

        next();
    });
}
