import { INode } from '../Commons/INode';
import BatchProcessDto from '../Utils/BatchProcessDto';

export interface IBatchNode extends INode {
  processAction(dto: BatchProcessDto): Promise<BatchProcessDto>|BatchProcessDto;
}
