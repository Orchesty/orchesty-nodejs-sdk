import { getCpuTimes, getCpuUsage, getCurrentTimestamp } from '../SystemUsage';

describe('Test system usages', () => {
    it('getCpuTimes', () => {
        const cpuTimes = getCpuTimes();

        expect(cpuTimes).toHaveProperty('cpuUserCodeTime');
        expect(typeof cpuTimes.cpuUserCodeTime).toEqual('number');
        expect(cpuTimes).toHaveProperty('cpuKernelCodeTime');
        expect(typeof cpuTimes.cpuKernelCodeTime).toEqual('number');
        expect(cpuTimes).toHaveProperty('cpuStartTime');
        expect(typeof cpuTimes.cpuStartTime).toEqual('number');
    });

    it('getCpuUsage', () => {
        expect(typeof getCpuUsage()).toEqual('number');
    });

    it('getCurrentTimestamp', () => {
        expect(typeof getCurrentTimestamp()).toEqual('number');
    });
});
