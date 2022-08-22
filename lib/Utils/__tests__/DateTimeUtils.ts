import { DateTime } from 'luxon';
import DateTimeUtils, { DATE_TIME } from '../DateTimeUtils';

describe('DateTimeUtils tests', () => {
    it('utcDate', () => {
        const date = DateTimeUtils.getUtcDate();
        expect(date).toBeDefined();
        expect(date).toBeInstanceOf(Date);
    });

    it('getFormatedDate', () => {
        const date = new Date(2021, 5, 4, 10, 30, 15);
        const formatted = DateTimeUtils.getFormattedDate(DateTime.fromJSDate(date), DATE_TIME);
        expect(formatted).toBeDefined();
        expect(formatted).toEqual('2021-06-04 10:30:15');
    });
});
