import { getTestContainer } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Metrics, { ITimesMetrics } from '../Metrics';

const mockITimesMetrics: ITimesMetrics = {
    requestDuration: Number(990719925474099),
    userTime: 5,
    kernelTime: 5,
};

let metrics: Metrics;
let container: DIContainer;

describe('Test metrics', () => {
    beforeAll(async () => {
        container = await getTestContainer();
        metrics = container.get(CoreServices.METRICS);
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
    });

    it('sendCurlMetrics', async () => {
        const curlMetrics = await metrics.sendCurlMetrics(mockITimesMetrics);
        expect(curlMetrics).toBeDefined();
    });

    it('sendProcessMetrics', async () => {
        const processMetric = await metrics.sendProcessMetrics(mockITimesMetrics);
        expect(processMetric).toBeDefined();
    });
});
