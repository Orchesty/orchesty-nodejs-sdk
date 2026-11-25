import { NextFunction, Request, Response } from 'express';
import { PassThrough } from 'stream';
import bodyParser from '../BodyParseHandler';

async function parse(parts: Buffer[]): Promise<string> {
    const req = new PassThrough() as unknown as Request;
    Object.assign(req, { method: 'POST', url: '/test', headers: {} });

    return new Promise((resolve) => {
        function next(): void {
            resolve(req.body as string);
        }
        bodyParser(req, {} as Response, next as NextFunction);

        const stream = req as unknown as PassThrough;
        parts.forEach((part) => stream.write(part));
        stream.end();
    });
}

describe('BodyParseHandler', () => {
    it('keeps a multi-byte character split across two chunks', async () => {
        const body = Buffer.from(JSON.stringify({ text: 'Dĺžka otevření' }), 'utf8');
        const splitAt = body.indexOf(Buffer.from('ĺ', 'utf8')) + 1;

        const parsed = await parse([body.subarray(0, splitAt), body.subarray(splitAt)]);

        expect(parsed).toEqual(body.toString('utf8'));
        expect(parsed).not.toContain('�');
    });

    it('parses a body sent in one chunk', async () => {
        const body = Buffer.from('{"text":"plain"}', 'utf8');

        expect(await parse([body])).toEqual('{"text":"plain"}');
    });
});
