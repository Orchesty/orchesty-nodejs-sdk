/* eslint-disable @typescript-eslint/naming-convention */
import { ITagsMap } from 'metrics-sender/dist/lib/metrics/Metrics';
import { getCpuTimes, getCurrentTimestamp, ICpuTimes } from '../Utils/SystemUsage';
import { metricsOptions } from '../Config/Config';
import logger from '../Logger/Logger';
import MetricsSenderLoader from './MetricsSenderLoader';
import DateTimeUtils from '../Utils/DateTimeUtils';

export interface IStartMetrics {
  timestamp: number,
  cpu: ICpuTimes,
}

export interface ITimesMetrics {
  requestDuration: number,
  userTime: number,
  kernelTime: number,
}

export default class Metrics {
  constructor(private _loader: MetricsSenderLoader) {
  }

  public async close(): Promise<void> {
    await this._loader.getSender().close();
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

    const fields: ITagsMap = {
      created: DateTimeUtils.getTimestamp(new Date()).toString(),
      fpm_request_total_duration: String(timeData.requestDuration),
      fpm_cpu_user_time: String(timeData.userTime),
      fpm_cpu_kernel_time: String(timeData.kernelTime),
    };

    try {
      return await this._loader.getSender()
        .send(metricsOptions.processMeasurement, fields, tags);
    } catch (e) {
      logger.error(e);
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

    const fields: ITagsMap = {
      created: DateTimeUtils.getTimestamp(new Date()).toString(),
      user_id: user ?? '',
      application_id: appKey ?? '',
      sent_request_total_duration: String(timeData.requestDuration),
    };

    try {
      return await this._loader.getSender()
        .send(metricsOptions.curlMeasurement, fields, tags);
    } catch (e) {
      logger.error(e);
      return false;
    }
  }

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
}
