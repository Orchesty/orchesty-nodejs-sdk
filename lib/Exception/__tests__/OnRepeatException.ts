import OnRepeatException from '../OnRepeatException';

let onRepeatException: OnRepeatException;

describe('test for OnRepeatException', () => {
    beforeEach(() => {
        onRepeatException = new OnRepeatException();
    });

    it('should get interval, maxHops', () => {
        onRepeatException.setInterval(5);
        onRepeatException.setMaxHops(1);
        expect(onRepeatException.getInterval()).toBe(5);
        expect(onRepeatException.getMaxHops()).toBe(1);
    });
});
