import { getTestContainer } from '../../../test/TestAbstact';
import { APPLICATION_PREFIX } from '../../Application/ApplicationRouter';
import { IApplication } from '../../Application/Base/IApplication';
import { BATCH_PREFIX } from '../../Batch/BatchRouter';
import { IBatchNode } from '../../Batch/IBatchNode';
import { ICommonNode } from '../../Commons/ICommonNode';
import { CONNECTOR_PREFIX } from '../../Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../../CustomNode/CustomNodeRouter';
import DIContainer from '../Container';

describe('Test DIContainer', () => {
    let container: DIContainer;
    let testConnector: ICommonNode;
    let testCustom: ICommonNode;
    let testBatch: IBatchNode;
    let testApp: IApplication;

    beforeAll(() => {
        container = getTestContainer();
        testConnector = container.getConnector('test');
        testCustom = container.getCustomNode('testcustom');
        testBatch = container.getBatch('testbatch');
        testApp = container.getApplication('test');
    });

    it('test set/has service', () => {
        const serviceName = 'testService';
        container.setNamed(serviceName, 'fake-service');

        expect(container.hasNamed(serviceName))
            .toBeTruthy();
    });

    it('test set/get service', () => {
        const serviceName = 'testService2';
        container.setNamed(serviceName, 'fake-service');

        expect(container.getNamed(serviceName))
            .toEqual('fake-service');
    });

    it('test set/get service instance', () => {
        class Losos {} // eslint-disable-line
        container.set(new Losos());

        expect(container.get(Losos)).toBeInstanceOf(Losos);
    });

    it('test set duplicate service', () => {
        const serviceName = 'testService3';
        container.setNamed(serviceName, 'fake-service');

        try {
            container.setNamed(serviceName, 'fake-service');

            expect(false)
                .toBeTruthy();
        } catch (e) {
            expect(e)
                .toBeInstanceOf(Error);
        }
    });

    it('test get non-exist service', () => {
        const serviceName = 'non-exist';
        try {
            container.getNamed(serviceName);

            expect(false)
                .toBeTruthy();
        } catch (e) {
            expect(e)
                .toBeInstanceOf(Error);
        }
    });

    it('test set/get CustomNode service', () => {
        expect(container.getNamed(`${CUSTOM_NODE_PREFIX}.${testCustom.getName()}`)).toEqual(testCustom);
        expect(container.getCustomNode(testCustom.getName())).toEqual(testCustom);
    });

    it('test set/get Batch service', () => {
        expect(container.getNamed(`${BATCH_PREFIX}.${testBatch.getName()}`)).toEqual(testBatch);
        expect(container.getBatch(testBatch.getName())).toEqual(testBatch);
    });

    it('test set/get Application service', () => {
        const cont = new DIContainer();
        cont.setApplication(testApp);

        expect(cont.getNamed(`${APPLICATION_PREFIX}.${testApp.getName()}`))
            .toEqual(testApp);
        expect(cont.getApplication(testApp.getName()))
            .toEqual(testApp);
    });

    it('test set/getAllByPrefix services', () => {
        const container2 = new DIContainer();
        container2.setConnector(testConnector);

        expect(container2.getAllByPrefix(CONNECTOR_PREFIX)).toEqual([{
            key: testConnector.getName(),
            value: testConnector,
        }]);
    });
});
