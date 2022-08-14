import ProcessDto from '../Utils/ProcessDto';
import { INode } from './INode';

export interface ICommonNode extends INode {
  processAction(dto: ProcessDto): Promise<ProcessDto>|ProcessDto;
}
