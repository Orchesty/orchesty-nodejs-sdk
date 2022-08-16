import ACommonNode from '../Commons/ACommonNode';
import ProcessDto from '../Utils/ProcessDto';
import ACommonConnector from './ACommonConnector';

export default abstract class AConnector extends ACommonConnector implements ACommonNode {

    public abstract processAction(dto: ProcessDto): ProcessDto | Promise<ProcessDto>;

}
