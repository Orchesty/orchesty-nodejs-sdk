import ACommonConnector from '../Connector/ACommonConnector';
import BatchProcessDto from '../Utils/BatchProcessDto';
import { IBatchNode } from './IBatchNode';

export default abstract class ABatchNode extends ACommonConnector implements IBatchNode {

    public abstract processAction(dto: BatchProcessDto): BatchProcessDto | Promise<BatchProcessDto>;

}
