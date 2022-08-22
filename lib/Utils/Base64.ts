export function decode(string: string, coder: BufferEncoding = 'base64'): string {
    return Buffer.from(string, coder).toString('binary');
}

export function encode(string: string, coder: BufferEncoding = 'base64'): string {
    return Buffer.from(string, 'binary').toString(coder);
}
