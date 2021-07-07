import { ICommonNode } from '../../lib/Commons/ICommonNode';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestBatch implements ICommonNode {
  getName(): string {
    return 'testbatch';
  }

  processAction(dto: ProcessDto): Promise<ProcessDto> {
    dto.data = '{dataTest: testValue}';
    dto.setBatchCursor('testCursor');
    return Promise.resolve(dto);
  }

}
