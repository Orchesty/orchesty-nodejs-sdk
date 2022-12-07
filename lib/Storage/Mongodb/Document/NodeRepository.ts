import Repository, { IQuery } from '../Repository';
import Node from './Node';

export type INodeQuery = IQuery;

export default class NodeRepository extends Repository<Node, INodeQuery> {

    public fromObject(object: unknown): Node {
        const node = new Node();
        return node.fromObject<Node>(node, object);
    }

}
