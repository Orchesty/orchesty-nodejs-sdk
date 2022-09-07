import ResultCode from '../../Utils/ResultCode';

export function createSuccessRange(from: number, to?: number): IRangeObject {
    return {
        from,
        to: to ?? from,
        action: ResultCode.SUCCESS,
    };
}

export function createFailRange(from: number, to?: number): IRangeObject {
    return {
        from,
        to: to ?? from,
        action: ResultCode.STOP_AND_FAILED,
    };
}

export function createRepeatRange(from: number, to?: number): IRangeObject {
    return {
        from,
        to: to ?? from,
        action: ResultCode.REPEAT,
    };
}

export interface IRangeObject {
    from: number;
    to: number;
    action: ResultCode;
}

export type ResultCodeRange = IRangeObject | number;
