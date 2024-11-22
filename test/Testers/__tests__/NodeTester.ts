import DIContainer from '../../../lib/DIContainer/Container';
import { getTestContainer } from '../../TestAbstact';
import NodeTester from '../NodeTester';

describe('Test NodeTester', () => {
    let container: DIContainer;

    beforeAll(() => {
        container = getTestContainer();
    });

    it('output - replacement', async () => {
        const tester = new NodeTester(container, __filename);
        await tester.testCustomNode('testcustom');

        expect(true).toEqual(true);
    });
});
