// eslint-disable-next-line no-shadow
enum HttpMethods {
    GET= 'GET',
    POST= 'POST',
    PUT= 'PUT',
    PATCH= 'PATCH',
    DELETE= 'DELETE',
    OPTIONS= 'OPTIONS',
    HEAD= 'HEAD',
}

export function parseHttpMethod(method: string | HttpMethods): HttpMethods {
  if (typeof method === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (<any>HttpMethods)[method];
  }
  return method;
}

export default HttpMethods;
