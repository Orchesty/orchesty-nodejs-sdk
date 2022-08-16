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
        const { headers } = editedDto;
        expect(headers).toEqual({
            cursor: 'testCursor',
            'result-code': '1010',
            // eslint-disable-next-line max-len
            'result-message': 'Message will be used as a iterator with cursor [testCursor]. Data will be send to follower(s).',
        });
    });
});
