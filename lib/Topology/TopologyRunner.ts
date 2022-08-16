import { StatusCodes } from 'http-status-codes';
import { Headers, HeadersInit } from 'node-fetch';
import { pipesOptions } from '../Config/Config';
import OnRepeatException from '../Exception/OnRepeatException';
import logger from '../Logger/Logger';
import CurlSender from '../Transport/Curl/CurlSender';
import RequestDto from '../Transport/Curl/RequestDto';
import ResponseDto from '../Transport/Curl/ResponseDto';
import HttpMethods from '../Transport/HttpMethods';
import { getCorrelationId, getNodeId, PREV_CORRELATION_ID, PREV_NODE_ID } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';

export default class TopologyRunner {

    public constructor(private readonly curlSender: CurlSender) {
    }

    public static getWebhookUrl(topology: string, node: string, token: string): string {
        return `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}/token/${token}/run`;
    }

    public async runByName(
        data: Record<string, unknown>,
        topology: string,
        node: string,
        processDto: ProcessDto,
        _user?: string,
        _headers?: HeadersInit,
    ): Promise<ResponseDto> {
        const user = _user !== undefined ? `/user/${_user}` : '';
        const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run-by-name`;

        return this.run(url, data, processDto, _headers);
    }

    public async runById(
        data: Record<string, unknown>,
        topology: string,
        node: string,
        processDto: ProcessDto,
        _user?: string,
        _headers?: HeadersInit,
    ): Promise<ResponseDto> {
        const user = _user !== undefined ? `/user/${_user}` : '';
        const url = `${pipesOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run`;

        return this.run(url, data, processDto, _headers);
    }

    private async run(
        url: string,
        data: Record<string, unknown>,
        processDto: ProcessDto,
        headers?: HeadersInit,
    ): Promise<ResponseDto> {
        let errMessage = `Call of starting-point with url [${url}] has been failed. Reason [__reason__]`;
        try {
            const requestDto = new RequestDto(
                url,
                HttpMethods.POST,
                processDto,
                JSON.stringify(data),
                new Headers({
                    ...headers ?? {},
                    [PREV_CORRELATION_ID]: getCorrelationId(processDto.headers) ?? '',
                    [PREV_NODE_ID]: getNodeId(processDto.headers) ?? '',
                }),
            );
            const resp = await this.curlSender.send(requestDto);
            if (resp.responseCode !== StatusCodes.OK) {
                errMessage = errMessage.replace('__reason__', 'ResponseCode is not 200');
                logger.error(errMessage, processDto);
                throw new OnRepeatException(60, 10, errMessage);
            }

            return resp;
        } catch (e) {
            if (e instanceof OnRepeatException) {
                throw e;
            }
            if (e instanceof Error) {
                errMessage = errMessage.replace('__reason__', e.message || 'unknown');
                logger.error(e.message || `${errMessage}: Unknown error!`, processDto);
            }

            throw new OnRepeatException(60, 10, errMessage);
        }
    }

}
