import CurlSender from '../Transport/Curl/CurlSender';
import ACommonNode from '../Commons/ACommonNode';

export default abstract class AConnector extends ACommonNode {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private sender?: CurlSender

  public setSender(sender: CurlSender): AConnector {
    this.sender = sender;

    return this;
  }

  protected get _sender(): CurlSender {
    if (this.sender) {
      return this.sender;
    }

    throw new Error('CurlSender has not set.');
  }
}
