import ACommonConnector from '../Connector/ACommonConnector';
import BatchProcessDto from '../Utils/BatchProcessDto';
import { IBatchNode } from './IBatchNode';

export default abstract class ABatchNode extends ACommonConnector implements IBatchNode {

    public constructor(protected resultAsBatch = false) {
        super();
    }

    public abstract processAction(dto: BatchProcessDto): BatchProcessDto | Promise<BatchProcessDto>;

}
