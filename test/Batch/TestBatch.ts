import { ICommonNode } from '../../lib/Commons/ICommonNode';
import ProcessDTO from '../../lib/Utils/ProcessDTO';

export default class TestBatch implements ICommonNode {
  getName(): string {
    return 'testbatch';
  }

  processAction(dto: ProcessDTO): Promise<ProcessDTO> {
    dto.setData('{dataTest: testValue}');
    dto.setBatchCursor('testCursor');
    return Promise.resolve(dto);
  }

}
