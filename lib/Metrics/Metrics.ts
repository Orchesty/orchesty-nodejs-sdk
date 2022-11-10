import { metricsOptions, orchestyOptions } from '../Config/Config';
import logger from '../Logger/Logger';
import { HttpMethods } from '../Transport/HttpMethods';
import { getCpuTimes, getCurrentTimestamp, ICpuTimes } from '../Utils/SystemUsage';
import Client from '../Worker-api/Client';

export type ITagsMap = Record<string, string>;

export interface IStartMetrics {
    timestamp: number;
    cpu: ICpuTimes;
}

export interface ITimesMetrics {
    requestDuration: number;
    userTime: number;
    kernelTime: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface IMetricsFields {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export default class Metrics {

    private readonly workerApi = new Client(orchestyOptions.workerApi);

    public static getCurrentMetrics(): IStartMetrics {
        return {
            timestamp: getCurrentTimestamp(),
            cpu: getCpuTimes(),
        };
    }

    public static getTimes(startMetrics: IStartMetrics): ITimesMetrics {
        const endMetrics = this.getCurrentMetrics();

        return {
            requestDuration: endMetrics.timestamp - startMetrics.timestamp,
            userTime: endMetrics.cpu.cpuUserCodeTime - startMetrics.cpu.cpuUserCodeTime,
            kernelTime: endMetrics.cpu.cpuKernelCodeTime - startMetrics.cpu.cpuKernelCodeTime,
        };
    }

    public async sendProcessMetrics(
        timeData: ITimesMetrics,
        topologyId?: string,
        nodeId?: string,
        correlationId?: string,
    ): Promise<boolean> {
        const tags: ITagsMap = {};
        if (topologyId) {
            tags.topology_id = topologyId;
        }
        if (nodeId) {
            tags.node_id = nodeId;
        }
        if (correlationId) {
            tags.correlation_id = correlationId;
        }

        const fields: IMetricsFields = {
            created: new Date(),
            fpm_request_total_duration: timeData.requestDuration,
            fpm_cpu_user_time: timeData.userTime,
            fpm_cpu_kernel_time: timeData.kernelTime,
        };

        try {
            const response = await this.workerApi.send(
                metricsOptions.processMeasurement,
                HttpMethods.POST,
                { fields, tags },
            );

            return response.status < 300;
        } catch (e) {
            if (e instanceof Error) {
                logger.error(e.message, {});
            }
            return false;
        }
    }

    public async sendCurlMetrics(
        timeData: ITimesMetrics,
        nodeId?: string,
        correlationId?: string,
        user?: string,
        appKey?: string,
    ): Promise<boolean> {
        const tags: ITagsMap = {};
        if (user) {
            tags.user_id = user;
        }
        if (appKey) {
            tags.application_id = appKey;
        }
        if (nodeId) {
            tags.node_id = nodeId;
        }
        if (correlationId) {
            tags.correlation_id = correlationId;
        }

        const fields: IMetricsFields = {
            created: new Date(),
            user_id: user ?? '',
            application_id: appKey ?? '',
            sent_request_total_duration: timeData.requestDuration,
        };

        try {
            const response = await this.workerApi.send(
                metricsOptions.curlMeasurement,
                HttpMethods.POST,
                { fields, tags },
            );

            return response.status < 300;
        } catch (e) {
            if (e instanceof Error) {
                logger.error(e.message, {});
            }
            return false;
        }
    }

}
