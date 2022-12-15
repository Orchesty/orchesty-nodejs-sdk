import DIContainer from '../../../lib/DIContainer/Container';
import ProcessDto from '../../../lib/Utils/ProcessDto';
import { getTestContainer } from '../../TestAbstact';
import TopologyTester from '../TopologyTester';

describe('Test topologyTester', () => {
    let container: DIContainer;

    beforeAll(() => {
        container = getTestContainer();
    });

    it('Run without specific StartingPoint', async () => {
        const dto = new ProcessDto();
        const tester = new TopologyTester(container, __filename);
        const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto);
        expect(res).toHaveLength(1);
        expect(res[0].getJsonData()).toEqual({ dataTest: 'testValue' });
    });

    it('Run with specific StartingPoint', async () => {
        const dto = new ProcessDto();
        const tester = new TopologyTester(container, __filename);
        const res = await tester.runTopology(`${__dirname}/Data/TopologyTester/test.tplg`, dto, '', 'Start');
        expect(res).toHaveLength(1);
        expect(res[0].getJsonData()).toEqual({ dataTest: 'testValue' });
    });
});
