import {
    get,
    getCorrelationId,
    getNodeId,
    getParentId,
    getProcessId,
    getRepeaterMaxHops,
    getRepeatHops,
    getSequenceId,
    IHttpHeaders,
    NODE_ID,
} from '../Headers';

const mockedHeaders: IHttpHeaders = {
    'node-id': 'nodeId',
    'correlation-id': 'correlationId',
    'process-id': 'processId',
    'parent-id': 'parentId',
    'sequence-id': '1',
    'repeat-hops': '2',
    'repeat-max-hops': '10',
    fake: 'header',
};

describe('Test headers utils', () => {
    it('get header by key', () => {
        const v = get(NODE_ID, mockedHeaders);
        expect(v).toEqual('nodeId');
    });

    it('get non-exist key in headers', () => {
        const v = get('non-exist', mockedHeaders);
        expect(v).toBeUndefined();
    });

    it('getCorrelationId', () => {
        const v = getCorrelationId(mockedHeaders);
        expect(v).toEqual('correlationId');
    });

    it('getNodeId', () => {
        const v = getNodeId(mockedHeaders);
        expect(v).toEqual('nodeId');
    });

    it('getProcessId', () => {
        const v = getProcessId(mockedHeaders);
        expect(v).toEqual('processId');
    });

    it('getParentId', () => {
        const v = getParentId(mockedHeaders);
        expect(v).toEqual('parentId');
    });

    it('getSequenceId', () => {
        const v = getSequenceId(mockedHeaders);
        expect(v).toEqual(1);
    });

    it('getSequenceId if not exist', () => {
        const updatedHeaders = mockedHeaders;
        delete updatedHeaders['sequence-id'];
        const v = getSequenceId(updatedHeaders);
        expect(v).toEqual(0);
    });

    it('getRepeatHops', () => {
        const v = getRepeatHops(mockedHeaders);
        expect(v).toEqual(2);
    });

    it('getRepeatHops if not exist', () => {
        const updatedHeaders = mockedHeaders;
        delete updatedHeaders['repeat-hops'];
        const v = getRepeatHops(updatedHeaders);
        expect(v).toEqual(0);
    });

    it('getRepeaterMaxHops', () => {
        const v = getRepeaterMaxHops(mockedHeaders);
        expect(v).toEqual(10);
    });

    it('getRepeaterMaxHops if not exist', () => {
        const updatedHeaders = mockedHeaders;
        delete updatedHeaders['repeat-max-hops'];
        const v = getRepeaterMaxHops(updatedHeaders);
        expect(v).toEqual(0);
    });
});
