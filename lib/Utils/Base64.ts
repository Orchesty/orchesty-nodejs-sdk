export const decode = (string: string, coder: BufferEncoding = 'base64'): string => Buffer.from(string, coder)
  .toString('binary');

export const encode = (string: string, coder: BufferEncoding = 'base64'): string => Buffer.from(string, 'binary')
  .toString(coder);
