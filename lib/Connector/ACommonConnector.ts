import ANode from '../Commons/ANode';
import CurlSender from '../Transport/Curl/CurlSender';

export default abstract class ACommonConnector extends ANode {

    private sender?: CurlSender;

    public setSender(sender: CurlSender): this {
        this.sender = sender;

        return this;
    }

    protected getSender(): CurlSender {
        if (this.sender) {
            return this.sender;
        }

        throw new Error('CurlSender has not been set.');
    }

}
