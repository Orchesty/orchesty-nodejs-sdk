import ABatchNode from '../../lib/Batch/ABatchNode';
import BatchProcessDto from '../../lib/Utils/BatchProcessDto';

const CURSOR = 'testCursor';

export default class TestBatch extends ABatchNode {

    public getName(): string {
        return 'testbatch';
    }

    public processAction(dto: BatchProcessDto): BatchProcessDto {
        dto.addItem({
            dataTest: 'testValue',
        });

        if (dto.getBatchCursor() === CURSOR) {
            dto.removeBatchCursor();
            return dto;
        }

        dto.setBatchCursor(CURSOR);

        return dto;
    }

}
