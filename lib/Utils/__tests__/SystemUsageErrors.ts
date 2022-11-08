import { getCpuTimes, getCpuUsage } from '../SystemUsage';

// Mock fs module
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue(undefined),
}));

describe('Test system usages - errors', () => {
    it('getCpuTimes', () => {
        const cpuTimes = getCpuTimes();

        expect(cpuTimes).toHaveProperty('cpuUserCodeTime');
        expect(cpuTimes.cpuUserCodeTime).toEqual(0);
        expect(cpuTimes).toHaveProperty('cpuKernelCodeTime');
        expect(cpuTimes.cpuKernelCodeTime).toEqual(0);
        expect(cpuTimes).toHaveProperty('cpuStartTime');
        expect(cpuTimes.cpuStartTime).toEqual(0);
    });

    it('getCpuUsage', () => {
        expect(getCpuUsage()).toEqual(0);
    });
});
