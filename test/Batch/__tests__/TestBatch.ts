import BatchProcessDto from '../../../lib/Utils/BatchProcessDto';
import TestBatch from '../TestBatch';

describe('Tests for TestBatch', () => {
    it('getName', () => {
        const batch = new TestBatch();

        expect(batch.getName()).toEqual('testbatch');
    });

    it('processAction', () => {
        const batch = new TestBatch();
        const editedDto = batch.processAction(new BatchProcessDto());

        expect(editedDto.getHeaders()).toEqual({
            cursor: 'testCursor',
            'result-code': '1010',

            'result-message': 'Message will be used as a iterator with cursor [testCursor]. Data will be send to follower(s).',
        });
    });
});
