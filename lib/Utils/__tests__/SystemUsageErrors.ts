import { getCpuTimes, getCpuUsage } from '../SystemUsage';

describe('Test system usages', () => {
    it('getCpuTimes', () => {
        const cpuTimes = getCpuTimes();

        expect(cpuTimes).toHaveProperty('cpuUserCodeTime');
        expect(typeof cpuTimes.cpuUserCodeTime).toBe('number');
        expect(cpuTimes.cpuUserCodeTime >= 0).toBeTruthy();
        expect(cpuTimes).toHaveProperty('cpuKernelCodeTime');
        expect(typeof cpuTimes.cpuKernelCodeTime).toBe('number');
        expect(cpuTimes.cpuKernelCodeTime >= 0).toBeTruthy();
        expect(cpuTimes).toHaveProperty('cpuStartTime');
        expect(typeof cpuTimes.cpuStartTime).toBe('number');
        expect(cpuTimes.cpuStartTime >= 0).toBeTruthy();
    });

    it('getCpuUsage', () => {
        const cpuUsage = getCpuUsage();
        expect(typeof cpuUsage).toBe('number');
        expect(cpuUsage >= 0).toBeTruthy();
    });
});
