enum ApplicationTypeEnum {
    CRON = 'cron',
    WEBHOOK = 'webhook',
}

export default ApplicationTypeEnum;

export function isWebhook(type: ApplicationTypeEnum): boolean {
    return type === ApplicationTypeEnum.WEBHOOK;
}

export function isCron(type: ApplicationTypeEnum): boolean {
    return type === ApplicationTypeEnum.CRON;
}
