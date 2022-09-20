import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import Annotation from '../Annotation';

jest.mock('../../Logger/Logger', () => ({
    error: () => jest.fn(),
    ctxFromDto: () => jest.fn(),
    ctxFromReq: () => jest.fn(),
    Logger: jest.fn().mockImplementation(() => ({})),
}));

describe('Annotation utils tests', () => {
    it('getAllMethods', () => {
        const listSyncMethod = Annotation.getAllMethods(new TestBasicApplication());
        expect(listSyncMethod.length > 0).toBeTruthy();
        expect(listSyncMethod[0]).toEqual('testSyncMethod');
    });
});
