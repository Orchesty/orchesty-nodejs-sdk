import { ObjectId } from 'mongodb';
import { getTestContainer } from '../../../../../test/TestAbstact';
import Node from '../Node';
import NodeRepository from '../NodeRepository';
import CoreServices from '../../../../DIContainer/CoreServices';
import DIContainer from '../../../../DIContainer/Container';
import MongoDbClient from '../../Client';

// Mock Logger module
jest.mock('../../../../Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

let container: DIContainer;
let nodeRepository: NodeRepository;
let node: Node;

const config = {
  sdk: {
    host: 'testHost',
  },
  bridge: {
    host: 'testHost',
  },
  rabbit: {
    prefetch: 'tesePrefetch',
  },
  repeater: {
    enabled: false,
    hops: 2,
    interval: 60,
  },
};

describe('tests for Node', () => {
  beforeAll(async () => {
    container = await getTestContainer();
    nodeRepository = container.getRepository(Node);
  });

  beforeEach(async () => {
    node = new Node().setConfigs(config);
    await nodeRepository.insert(node);
  });

  afterEach(async () => {
    await nodeRepository.remove(node);
  });

  afterAll(() => {
    (container.get(CoreServices.MONGO) as MongoDbClient).down();
  });

  it('get system setting as string', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const databaseNode = await nodeRepository.findOne({ _id: new ObjectId(node.getId()) });
    expect(databaseNode?.getSystemConfigs()).toBe(JSON.stringify(config));
  });

  it('get system setting as ISystemConfigs', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const databaseNode = await nodeRepository.findOne({ _id: new ObjectId(node.getId()) });
    expect(databaseNode?.getSystemConfigsFromString()).toEqual(config);
  });

  it('get system setting - undefined', () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const emptyNode = new Node();
    expect(emptyNode.getSystemConfigsFromString()).toBe(undefined);
  });

  it('set as deleted', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const databaseNode = await nodeRepository.findOne({ _id: new ObjectId(node.getId()) });
    databaseNode?.setDeleted();
    expect(databaseNode?.isDeleted()).toBeTruthy();
  });
});