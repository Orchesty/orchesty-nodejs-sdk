import ResultCode from '../../Utils/ResultCode';

export function makeSuccessCodeObject(from: number, to: number): ICodeObject {
    return {
        from,
        to,
        action: ResultCode.SUCCESS,
    };
}

export function makeStopAndFailCodeObject(from: number, to: number): ICodeObject {
    return {
        from,
        to,
        action: ResultCode.STOP_AND_FAILED,
    };
}

export function makeRepeatCodeObject(from: number, to: number): ICodeObject {
    return {
        from,
        to,
        action: ResultCode.REPEAT,
    };
}

export interface ICodeObject {
    from: number;
    to: number;
    action: ResultCode;
}

export type AllowedCode = ICodeObject | number;
