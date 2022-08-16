import { getTestContainer } from '../../../test/TestAbstact';
import DIContainer from '../../DIContainer/Container';
import CoreServices from '../../DIContainer/CoreServices';
import MongoDbClient from '../../Storage/Mongodb/Client';
import Influx from '../Impl/Influx';
import Mongo from '../Impl/Mongo';
import Metrics from '../Metrics';
import MetricsSenderLoader, { INFLUX, MONGO } from '../MetricsSenderLoader';

// Mock Logger module
jest.mock('../../Logger/Logger', () => ({
    error: () => jest.fn(),
    debug: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('tests for MetricsSenderLoader', () => {
    let container: DIContainer;

    beforeAll(async () => {
        container = await getTestContainer();
    });

    afterAll(async () => {
        await container.get<MongoDbClient>(CoreServices.MONGO).down();
        await container.get<Metrics>(CoreServices.METRICS).close();
    });

    it('getSender - mongo', () => {
        const client: MongoDbClient = container.get(CoreServices.MONGO);
        const metricsSenderLoader = new MetricsSenderLoader(MONGO, undefined, new Mongo(client));
        const sender = metricsSenderLoader.getSender();
        expect(sender)
            .toBeInstanceOf(Mongo);
    });

    it('getSender - mongo: undefined', () => {
        const metricsSenderLoader = new MetricsSenderLoader(MONGO, undefined, undefined);
        expect(() => {
            metricsSenderLoader.getSender();
        })
            .toThrow('Mongo metrics sender has not been set.');
    });

    it('getSender - influx', () => {
        const metricsSenderLoader = new MetricsSenderLoader(INFLUX, new Influx(), undefined);
        const sender = metricsSenderLoader.getSender();
        expect(sender)
            .toBeInstanceOf(Influx);
    });

    it('getSender - influx: undefined', () => {
        const metricsSenderLoader = new MetricsSenderLoader(INFLUX, undefined, undefined);
        expect(() => {
            metricsSenderLoader.getSender();
        })
            .toThrow('Influx metrics sender has not been set.');
    });

    it('getSender - unknown: undefined', () => {
        const invalidService = 'Invalid';
        const metricsSenderLoader = new MetricsSenderLoader(invalidService, undefined, undefined);
        expect(() => {
            metricsSenderLoader.getSender();
        })
            // eslint-disable-next-line max-len
            .toThrow(`Environment [METRICS_SERVICE=${invalidService}] is not a valid option. Valid options are: influx, mongo`);
    });
});
