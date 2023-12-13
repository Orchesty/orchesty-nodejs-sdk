import { StatusCodes } from 'http-status-codes';
import { orchestyOptions } from '../Config/Config';
import OnRepeatException from '../Exception/OnRepeatException';
import logger from '../Logger/Logger';
import CurlSender from '../Transport/Curl/CurlSender';
import RequestDto from '../Transport/Curl/RequestDto';
import ResponseDto from '../Transport/Curl/ResponseDto';
import { HttpMethods } from '../Transport/HttpMethods';
import { getCorrelationId, getNodeId, ORCHESTY_API_KEY, PREV_CORRELATION_ID, PREV_NODE_ID } from '../Utils/Headers';
import ProcessDto from '../Utils/ProcessDto';

export default class TopologyRunner {

    public constructor(private readonly curlSender: CurlSender) {
    }

    public static getWebhookUrl(topology: string, node: string, token: string): string {
        return `${orchestyOptions.startingPoint}/topologies/${topology}/nodes/${node}/token/${token}/run`;
    }

    public static getStartUrl(topology: string, node: string, runByName = true, _user?: string): string {
        const user = _user !== undefined ? `/user/${_user}` : '';

        return `${orchestyOptions.startingPoint}/topologies/${topology}/nodes/${node}${user}/run${runByName ? '-by-name' : ''}`;
    }

    public async runByName(
        data: Record<string, unknown>,
        topology: string,
        node: string,
        processDto: ProcessDto,
        _user?: string,
        _headers?: Record<string, string>,
    ): Promise<ResponseDto> {
        const url = TopologyRunner.getStartUrl(topology, node, true, _user);

        return this.run(url, data, processDto, _headers);
    }

    public async runById(
        data: Record<string, unknown>,
        topology: string,
        node: string,
        processDto: ProcessDto,
        _user?: string,
        _headers?: Record<string, string>,
    ): Promise<ResponseDto> {
        const url = TopologyRunner.getStartUrl(topology, node, false, _user);

        return this.run(url, data, processDto, _headers);
    }

    private async run(
        url: string,
        data: Record<string, unknown>,
        processDto: ProcessDto,
        headers?: Record<string, string>,
    ): Promise<ResponseDto> {
        let errMessage = `Call of starting-point with url [${url}] has been failed. Reason [__reason__]`;
        try {
            const requestDto = new RequestDto(
                url,
                HttpMethods.POST,
                processDto,
                JSON.stringify(data),
                {
                    ...headers ?? {},
                    [PREV_CORRELATION_ID]: getCorrelationId(processDto.getHeaders()) ?? '',
                    [PREV_NODE_ID]: getNodeId(processDto.getHeaders()) ?? '',
                    [ORCHESTY_API_KEY]: orchestyOptions.orchestyApiKey,
                },
            );
            const resp = await this.curlSender.send(requestDto);
            if (resp.getResponseCode() !== StatusCodes.OK) {
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
