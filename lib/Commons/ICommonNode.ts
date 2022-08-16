import ProcessDto from '../Utils/ProcessDto';
import { INode } from './INode';

export interface ICommonNode extends INode {
    processAction(dto: ProcessDto): ProcessDto | Promise<ProcessDto>;
}
