import DIContainer from '../../../lib/DIContainer/Container';
import CoreServices from '../../../lib/DIContainer/CoreServices';
import Metrics from '../../../lib/Metrics/Metrics';
import MongoDbClient from '../../../lib/Storage/Mongodb/Client';
import { getTestContainer } from '../../TestAbstact';
import NodeTester from '../NodeTester';

describe('Test NodeTester', () => {
    let container: DIContainer;
    beforeAll(async () => {
        container = await getTestContainer();
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('output - replacement', async () => {
        const tester = new NodeTester(container, __filename);
        await tester.testCustomNode('testcustom');

        expect(true).toEqual(true);
    });
});
