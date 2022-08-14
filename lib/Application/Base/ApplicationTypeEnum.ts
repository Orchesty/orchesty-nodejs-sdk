// eslint-disable-next-line no-shadow
enum ApplicationTypeEnum {
  CRON = 'cron',
  WEBHOOK = 'webhook',
}

export default ApplicationTypeEnum;

export function isWebhook(type: string): boolean {
  return type === ApplicationTypeEnum.WEBHOOK;
}

export function isCron(type: string): boolean {
  return type === ApplicationTypeEnum.CRON;
}
