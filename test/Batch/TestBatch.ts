import { IBatchNode } from '../../lib/Batch/IBatchNode';
import BatchProcessDto from '../../lib/Utils/BatchProcessDto';

const CURSOR = 'testCursor';

export default class TestBatch implements IBatchNode {
  getName = (): string => 'testbatch';

  processAction = (_dto: BatchProcessDto): BatchProcessDto => {
    const dto = _dto;
    dto.addItem({
      dataTest: 'testValue',
    });

    if (dto.getBatchCursor() === CURSOR) {
      dto.removeBatchCursor();
      return dto;
    }

    dto.setBatchCursor(CURSOR);

    return dto;
  };
}
