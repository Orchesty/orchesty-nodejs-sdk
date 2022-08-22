import ProcessDto from '../Utils/ProcessDto';
import ANode from './ANode';
import { ICommonNode } from './ICommonNode';

export default abstract class ACommonNode extends ANode implements ICommonNode {

    public abstract processAction(dto: ProcessDto): ProcessDto | Promise<ProcessDto>;

}
