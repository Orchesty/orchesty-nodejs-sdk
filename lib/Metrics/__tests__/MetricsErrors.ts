import { getTestContainer } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import Metrics, { ITimesMetrics } from '../Metrics';

const mockITimesMetrics: ITimesMetrics = {
    requestDuration: Number(990719925474099),
    userTime: 5,
    kernelTime: 5,
};

let metrics: Metrics;
let container: DIContainer;

describe('Test metrics', () => {
    beforeAll(() => {
        container = getTestContainer();
        metrics = container.get(Metrics);
    });

    it('sendCurlMetrics', async () => {
        const curlMetrics = await metrics.sendCurlMetrics(mockITimesMetrics, 1, '', '');

        expect(curlMetrics).toBeDefined();
    });

    it('sendProcessMetrics', async () => {
        const processMetric = await metrics.sendProcessMetrics(mockITimesMetrics);

        expect(processMetric).toBeDefined();
    });
});
