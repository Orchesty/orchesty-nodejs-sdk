import { NextFunction, Request, Response } from 'express';

export default function bodyParser(req: Request, res: Response, next: NextFunction): void {
  let data = '';
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => {
    req.body = data;
    next();
  });
}
