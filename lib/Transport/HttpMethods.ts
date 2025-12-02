export enum HttpMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function parseHttpMethod(method: HttpMethods | string): HttpMethods {
    if (typeof method === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (HttpMethods as any)[method];
    }
    return method;
}
