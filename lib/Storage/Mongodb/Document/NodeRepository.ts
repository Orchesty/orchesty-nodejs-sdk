import Repository from '../Repository';
import Node from './Node';

export default class NodeRepository extends Repository<Node> {

    public fromObject(object: unknown): Node {
        const node = new Node();
        return node.fromObject<Node>(node, object);
    }

}
