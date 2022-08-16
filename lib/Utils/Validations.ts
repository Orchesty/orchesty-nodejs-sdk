/* eslint-disable import/prefer-default-export */
export function checkParams(object: Record<string, unknown>, params: unknown): boolean {
    if (Array.isArray(params)) {
        for (const param of params) {
            if (Array.isArray(param) || typeof param === 'object') {
                checkParams(object[0] as Record<string, unknown>, param); // Values was object or an array of objects
            } else {
                /* eslint-disable no-lonely-if */
                if (!Object.hasOwn(object, param)) {
                    throw Error(`Missing required param [${param}]`);
                }
            }
        }
    } else if (params !== null && typeof params === 'object') {
        const paramsObj = params as Record<string, unknown>;
        const keys = Object.keys(paramsObj);
        for (const key of keys) {
            if (!Object.hasOwn(object, key)) {
                throw Error(`Missing required param [${key}]`);
            }
            checkParams(object[key] as Record<string, unknown>, paramsObj[key]); // Nested object check
        }
    }

    return true;
}
