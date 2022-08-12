import AConnector from '../Connector/AConnector';
import BatchProcessDto from '../Utils/BatchProcessDto';
import { IBatchNode } from './IBatchNode';

export default abstract class ABatchNode extends AConnector implements IBatchNode {
  // eslint-disable-next-line
  // @ts-ignore
  public abstract processAction(dto: BatchProcessDto): Promise<BatchProcessDto> | BatchProcessDto;
}
