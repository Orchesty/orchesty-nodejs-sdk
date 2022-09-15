import BatchProcessDto from '../BatchProcessDto';
import { BATCH_CURSOR, LIMITER_KEY, USER } from '../Headers';

describe('Tests ProcessDto utils', () => {
    it('ShouldRemoveBatchCursor', () => {
        const dto = new BatchProcessDto();
        const cursorName = 'name';
        dto.setBatchCursor(cursorName);
        dto.removeBatchCursor();
        expect(dto.getHeader(BATCH_CURSOR)).toBeUndefined();
    });

    it('removeBatchCursor removes iterate-only cursor correctly', () => {
        const dto = new BatchProcessDto();
        dto.setBatchCursor('0', true);

        dto.removeBatchCursor();

        expect(dto.getHeaders()).toEqual({});
    });

    it('removeBatchCursor removes batch-with-cursor cursor correctly', () => {
        const dto = new BatchProcessDto();
        dto.setBatchCursor('0');

        dto.removeBatchCursor();

        expect(dto.getHeaders()).toEqual({});
    });

    it('addMessage adds message correctly', () => {
        const dto = new BatchProcessDto();
        const message = { body: '', headers: { key: 'value' } };
        dto.addMessage(message);

        expect(dto.getMessages()).toEqual([message]);
    });

    it('setMessages adds message correctly', () => {
        const dto = new BatchProcessDto();
        const message = { body: '', headers: { key: 'value' } };
        dto.setMessages([message]);

        expect(dto.getMessages()).toEqual([message]);
    });

    it('addItem adds message correctly', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const message = { foo: 'bar' };
        dto.addItem(message, 'abc');
        dto.addItem(message, undefined, 'limit');
        dto.addItem(message, 'abc', 'limit');

        expect(dto.getMessages()).toEqual([
            { body: '{"foo":"bar"}', headers: { [USER]: 'abc' } },
            { body: '{"foo":"bar"}', headers: { [LIMITER_KEY]: 'limit' } },
            { body: '{"foo":"bar"}', headers: { [USER]: 'abc', [LIMITER_KEY]: 'limit' } },
        ]);
    });

    it('setItemList adds message correctly', () => {
        const dto = new BatchProcessDto<unknown, { foo: string }>();
        const message = { foo: 'bar' };
        dto.setItemList([message]);

        expect(dto.getMessages()).toEqual([{ body: '{"foo":"bar"}', headers: null }]);
    });
});
