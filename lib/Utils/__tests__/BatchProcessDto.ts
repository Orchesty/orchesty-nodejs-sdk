import BatchProcessDto from '../BatchProcessDto';
import { BATCH_CURSOR } from '../Headers';

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

    it('setItemList adds message correctly', () => {
        const dto = new BatchProcessDto();
        const message = { foo: 'bar' };
        dto.setItemList<{ foo: string }>([message]);

        expect(dto.getMessages()).toEqual([{ body: '{"foo":"bar"}', headers: null }]);
    });
});
