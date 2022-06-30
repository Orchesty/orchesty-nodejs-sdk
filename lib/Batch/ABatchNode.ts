import AConnector from '../Connector/AConnector';
import BatchProcessDto from '../Utils/BatchProcessDto';
import { IBatchNode } from './IBatchNode';
import CurlSender from '../Transport/Curl/CurlSender';
import { IApplication } from '../Application/Base/IApplication';
import MongoDbClient from '../Storage/Mongodb/Client';

export default abstract class ABatchNode extends AConnector implements IBatchNode {
  public abstract processAction(dto: BatchProcessDto): Promise<BatchProcessDto> | BatchProcessDto;

  public setSender(sender: CurlSender): ABatchConnector {
    this.sender = sender;

    return this;
  }

  public setApplication(application: IApplication): ABatchConnector {
    this.application = application;

    return this;
  }

  public setDb(db: MongoDbClient): ABatchConnector {
    this.db = db;

    return this;
  }
}
