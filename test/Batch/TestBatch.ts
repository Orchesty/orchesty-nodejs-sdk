import { ICommonNode } from '../../lib/Commons/ICommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestBatch implements ICommonNode {
  getName = (): string => 'testbatch';

  processAction = async (_dto: ProcessDto): Promise<ProcessDto> => {
    const dto = _dto;
    dto.data = '{dataTest: testValue}';
    dto.setBatchCursor('testCursor');
    return Promise.resolve(dto);
  };
}
