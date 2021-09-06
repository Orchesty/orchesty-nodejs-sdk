import { getTestContainer } from '../../TestAbstact';
import NodeTester from '../NodeTester';

// Mock Logger module
jest.mock('../../../lib/Logger/Logger', () => ({
  error: () => jest.fn(),
  debug: () => jest.fn(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Logger: jest.fn().mockImplementation(() => ({})),
}));

const container = getTestContainer();
describe('Test NodeTester', () => {
  it('output - replacement', async () => {
    const tester = new NodeTester(container, __filename);
    await tester.testCustomNode('testcustom');
  });
});
