import { DateTime } from 'luxon';

export const DATE_TIME = 'yyyy-LL-dd hh:mm:ss';
export const ISO_8601 = 'yyyy-LL-dd\'T\'HH:mm:ssZZZ';

export default class DateTimeUtils {

    /**
     *
     */
    public static get utcDate(): Date {
        return new Date(new Date().toUTCString());
    }

    /**
     * https://moment.github.io/luxon/#/formatting?id=table-of-tokens
     * @param date
     * @param format
     */
    public static getFormattedDate(date: DateTime, format: string): string {
        return date.toFormat(format);
    }

    /**
     * @param date
     */
    public static getTimestamp(date: Date): number {
        return DateTime.fromJSDate(date).toMillis();
    }

}
