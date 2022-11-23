export type StatusRange = (number | string) [] | number | string;

export const defaultRanges: IResultRanges = {
    success: '<300',
    stopAndFail: ['300-408', '409-429', '430-500'],
    repeat: [408, 429, '>=500'],
};

export const repeatOnErrorRanges: IResultRanges = {
    success: '<300',
    repeat: '>=300',
};

export const continueOnNotFoundRanges: IResultRanges = {
    success: ['<300', 404],
    stopAndFail: ['300-404', '405-408', '409-429', '430-500'],
    repeat: [408, 429, '>=500'],
};

export const continueOnErrorRanges: IResultRanges = {
    success: '<500',
    stopAndFail: '>=500',
};

export const keepAllRanges: StatusRange = '<999';

/**
    Example usage:
    {
        success: [200, 201],
        stopAndFail: '400-500',
        repeat: '>=500',
    }
 */

export interface IResultRanges {
    success?: StatusRange;
    stopAndFail?: StatusRange;
    repeat?: StatusRange;
}

/* eslint-disable eqeqeq */
export function inRange(status: number | string, range: StatusRange): boolean {
    const st = Number(status);
    if (['number', 'string'].includes(typeof range) && status == range) {
        return true;
    }

    let ranges = range;
    if (!Array.isArray(range)) {
        ranges = [range];
    }

    for (const it of ranges as (number | string)[]) {
        if (status == it) return true;
        if (typeof it === 'string') {
            if (it.startsWith('<=') && st <= Number(it.substring(2))) {
                return true;
            }
            if (it.startsWith('>=') && st >= Number(it.substring(2))) {
                return true;
            }
            if (it.startsWith('<') && st < Number(it.substring(1))) {
                return true;
            }
            if (it.startsWith('>') && st > Number(it.substring(1))) {
                return true;
            }
            if (it.includes('-')) {
                const [from, to] = it.split('-');
                if (st >= Number(from) && st < Number(to)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/* eslint-enable eqeqeq */
