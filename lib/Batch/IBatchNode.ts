import { ICommonNode } from '../Commons/ICommonNode';
import BatchProcessDto from '../Utils/BatchProcessDto';

export interface IBatchNode extends ICommonNode {
  processAction(dto: BatchProcessDto): Promise<BatchProcessDto>|BatchProcessDto;
}
