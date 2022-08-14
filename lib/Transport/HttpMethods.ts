// eslint-disable-next-line no-shadow
export enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

export function parseHttpMethod(method: HttpMethods | string): HttpMethods {
  if (typeof method === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (HttpMethods as any)[method];
  }
  return method;
}

export default HttpMethods;
