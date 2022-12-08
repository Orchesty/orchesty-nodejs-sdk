import { mockOnce, nodeConfig } from '../../../../../test/MockServer';
import { getTestContainer } from '../../../../../test/TestAbstact';
import { orchestyOptions } from '../../../../Config/Config';
import DIContainer from '../../../../DIContainer/Container';
import { HttpMethods } from '../../../../Transport/HttpMethods';
import Node from '../Node';
import NodeRepository from '../NodeRepository';

let container: DIContainer;
let nodeRepository: NodeRepository;
let node: Node;

describe('tests for Node', () => {
    beforeAll(() => {
        container = getTestContainer();
        nodeRepository = container.getRepository(Node);
    });

    beforeEach(() => {
        node = new Node().setConfigs(nodeConfig);
    });

    it('get system setting as string', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/Node?filter={"ids":["${node.getId()}"]}`,
            },
            response: { body: [{ id: '1', systemConfigs: JSON.stringify(nodeConfig) }] },
        }]);

        const databaseNode = await nodeRepository.findOne({ ids: [node.getId()] });
        expect(databaseNode?.getSystemConfigs()).toBe(JSON.stringify(nodeConfig));
    });

    it('get system setting as ISystemConfigs', async () => {
        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/Node?filter={"ids":["${node.getId()}"]}`,
            },
            response: { body: [{ id: '1', systemConfigs: JSON.stringify(nodeConfig) }] },
        }]);

        const databaseNode = await nodeRepository.findOne({ ids: [node.getId()] });
        expect(databaseNode?.getSystemConfigsFromString()).toEqual(nodeConfig);
    });

    it('get system setting - undefined', () => {
        const emptyNode = new Node();
        expect(emptyNode.getSystemConfigsFromString()).toBe(undefined);
    });
});
