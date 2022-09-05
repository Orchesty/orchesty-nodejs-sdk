// eslint-disable-next-line
function checkParam(object: { [key: string]: unknown }, param: string, strict: boolean): void {
    if (!Object.hasOwn(object, param)) {
        throw Error(`Missing required param [${param}]`);
    } else if (strict && (object[param] === null || object[param] === undefined || object[param] === '')) {
        throw Error(`Missing required param [${param}]`);
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function checkParams<T extends {} = Record<string, unknown>>(
    object: T,
    params: unknown,
    strict = false,
): boolean {
    if (Array.isArray(params)) {
        for (const param of params) {
            if (Array.isArray(param) || typeof param === 'object') {
                if (Array.isArray(object) || 0 in object) {
                    checkParams((
                        object as Record<number, Record<string, unknown>>
                        | Record<string, Record<string, unknown>>[]
                    )[0], param); // Values was object or an array of objects
                }
            } else {
                checkParam(object, param, strict);
            }
        }
    } else if (params !== null && typeof params === 'object') {
        const paramsObj = params as Record<string, unknown>;
        const keys = Object.keys(paramsObj);
        for (const key of keys) {
            checkParam(object, key, strict);
            checkParams((object as Record<string, Record<string, unknown>>)[key], paramsObj[key]); // Nested object check
        }
    }

    return true;
}
