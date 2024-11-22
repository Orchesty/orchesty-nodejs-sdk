import { Schema } from 'joi';
import AProcessDto from './AProcessDto';
import ResultCode from './ResultCode';

export class ValidationError extends Error {

    public constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

}

// eslint-disable-next-line
function checkParam(object: { [key: string]: unknown }, param: string, strict: boolean): void {
    if (!Object.hasOwn(object, param)) {
        throw new ValidationError(`Missing required param [${param}]`);
    } else if (strict && (object[param] === null || object[param] === undefined || object[param] === '')) {
        throw new ValidationError(`Missing required param [${param}]`);
    }
}

export function checkParams<T extends {} = Record<string, unknown>>(
    object: T,
    params: unknown,
    strict = false,
): boolean {
    if (Array.isArray(params)) {
        for (const param of params) {
            if (Array.isArray(param) || typeof param === 'object') {
                if (Array.isArray(object)) {
                    object.forEach((it) => checkParams(it, param, strict));
                } else if (0 in object) {
                    let key = 0;
                    while (key in object) {
                        checkParams((object as Record<number, object>)[key], param, strict);
                        key++;
                    }
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
            checkParams((object as Record<string, Record<string, unknown>>)[key], paramsObj[key], strict); // Nested object check
        }
    }

    return true;
}

export function validate(schema: Schema, strict = false) {
    return function(
        target: Object, // eslint-disable-line
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ): void {
        const originalMethod = descriptor.value;
        descriptor.value = function(dto: AProcessDto, ...args: unknown[]) {
            const valid = schema.validate(dto.getJsonData(), { allowUnknown: !strict });
            if (valid.error) {
                dto.setStopProcess(ResultCode.STOP_AND_FAILED, valid.error.message);

                return dto;
            }

            return originalMethod.call(this, dto, ...args);
        };
    };
}
