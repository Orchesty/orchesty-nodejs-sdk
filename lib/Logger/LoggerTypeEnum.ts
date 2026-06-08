enum LoggerTypeEnum {
    INTERNAL = 'internal',
    EXTERNAL = 'external',
    INTERNAL_EXTERNAL = 'internal_external',
}

export default LoggerTypeEnum;

export function logToInternal(type: LoggerTypeEnum): boolean {
    return type === LoggerTypeEnum.INTERNAL || type === LoggerTypeEnum.INTERNAL_EXTERNAL;
}

export function logToExternal(type: LoggerTypeEnum): boolean {
    return type === LoggerTypeEnum.EXTERNAL || type === LoggerTypeEnum.INTERNAL_EXTERNAL;
}

export function parseLoggerType(value?: string): LoggerTypeEnum {
    if (value === LoggerTypeEnum.EXTERNAL) {
        return LoggerTypeEnum.EXTERNAL;
    }

    if (value === LoggerTypeEnum.INTERNAL_EXTERNAL) {
        return LoggerTypeEnum.INTERNAL_EXTERNAL;
    }

    return LoggerTypeEnum.INTERNAL;
}
