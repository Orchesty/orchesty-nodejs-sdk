import { ICommonNode } from '../../lib/Commons/ICommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';

const CURSOR = 'testCursor';

export default class TestBatch implements ICommonNode {
  getName = (): string => 'testbatch';

  processAction = (_dto: ProcessDto): ProcessDto => {
    const dto = _dto;
    dto.data = '{dataTest: testValue}';
    dto.jsonData = [{ dataTest: 'testValue' }];

    if (dto.getBatchCursor() === CURSOR) {
      dto.removeBatchCursor();
      return dto;
    }

    dto.setBatchCursor(CURSOR);

    return dto;
  };
}
