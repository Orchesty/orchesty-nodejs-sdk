import BatchProcessDto from '../../lib/Utils/BatchProcessDto';
import ABatchNode from '../../lib/Batch/ABatchNode';

const CURSOR = 'testCursor';

export default class TestBatch extends ABatchNode {
  public getName = (): string => 'testbatch';

  public processAction = (_dto: BatchProcessDto): BatchProcessDto => {
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
