import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import OnRepeatException from '../../Exception/OnRepeatException';
import OnStopAndFailException from '../../Exception/OnStopAndFailException';
import logger from '../../Logger/Logger';
import Severity from '../../Logger/Severity';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';
import { APPLICATION, CORRELATION_ID, NODE_ID, USER } from '../../Utils/Headers';
import ResultCode from '../../Utils/ResultCode';
import RequestDto from './RequestDto';
import ResponseDto from './ResponseDto';
import { ResultCodeRange } from './ResultCodeRange';

export default class CurlSender {

    public constructor(private readonly metrics: Metrics) {
    }

    public async send<JsonBody = unknown>(
        dto: RequestDto,
        codeRange?: ResultCodeRange[],
        sec = 60,
        hops = 10,
        // eslint-disable-next-line @typescript-eslint/require-await
        logMessageCallback = async (res: AxiosResponse, body: string) => `status: ${res.status}, body: ${body}`,
    ): Promise<ResponseDto<JsonBody>> {
        const startTime = Metrics.getCurrentMetrics();
        try {
            const req = CurlSender.createInitFromDto(dto);
            const response = await axios(dto.getUrl(), req);
            await this.sendMetrics(dto, startTime);
            const buffer = await response.data;
            const body = buffer?.toString() ?? '';
            CurlSender.log(dto, req, response, body);

            if (codeRange) {
                return await this.handleByResultCode(
                    response,
                    body,
                    buffer,
                    codeRange,
                    logMessageCallback,
                    sec,
                    hops,
                );
            }

            return this.returnResponseDto(body, response, buffer);
        } catch (e) {
            await this.sendMetrics(dto, startTime);
            if (e instanceof Error) {
                logger.error(e.message, dto.getDebugInfo());
            }

            if (e instanceof AxiosError) {
                if (e.message.includes('network timeout')) {
                    throw new OnRepeatException(sec, hops, e.message);
                }
            }

            throw e;
        }
    }

    public returnResponseDto<JsonBody>(body: string, response: AxiosResponse, buffer: Buffer): ResponseDto<JsonBody> {
        return new ResponseDto(body, response.status, response.headers, buffer, response.statusText);
    }

    public async handleByResultCode<JsonBody = unknown>(
        response: AxiosResponse,
        body: string,
        buffer: Buffer,
        codeRange: ResultCodeRange[],
        logMessageCallback: (res: AxiosResponse, body: string) => Promise<string>,
        sec?: number,
        hops?: number,
    ): Promise<ResponseDto<JsonBody>> {
        for (const code of codeRange ?? []) {
            if (typeof code === 'number') {
                if (code === response.status) {
                    return this.returnResponseDto(body, response, buffer);
                }
            } else {
                const codeObject = code;
                if (response.status >= codeObject.from && response.status <= codeObject.to) {
                    // eslint-disable-next-line max-depth
                    switch (codeObject.action) {
                        case ResultCode.SUCCESS:
                            return this.returnResponseDto(body, response, buffer);
                        case ResultCode.STOP_AND_FAILED:
                            // eslint-disable-next-line no-await-in-loop
                            throw new OnStopAndFailException(await logMessageCallback(response, body));
                        case ResultCode.REPEAT:
                            // eslint-disable-next-line no-await-in-loop
                            throw new OnRepeatException(sec, hops, await logMessageCallback(response, body));
                        default:
                            throw new Error(`Unsupported action [${codeObject.action}]`);
                    }
                }
            }
        }

        if (response.status < 300) {
            return this.returnResponseDto(body, response, buffer);
        }

        throw new OnRepeatException(sec, hops, await logMessageCallback(response, body));
    }

    private static createInitFromDto(dto: RequestDto): AxiosRequestConfig {
        const req: AxiosRequestConfig = {
            method: dto.getMethod(),
            headers: dto.getHeaders(),
            timeout: dto.getTimeout(),
            responseType: 'arraybuffer',
            validateStatus: () => true,
        };

        if (dto.getBody() !== undefined) {
            req.data = dto.getBody();
        }

        return req;
    }

    private static log<T = unknown>(
        requestDto: RequestDto,
        request: AxiosRequestConfig,
        response: AxiosResponse<T>,
        body: string,
        level = Severity.DEBUG,
    ): void {
        let severity = level;
        let message = 'Request success.';
        if (response.status > 300) {
            message = 'Request failed.';
            severity = Severity.ERROR;
        }

        logger.log(
            severity,
            `${message}
       Method: ${request.method},
       Url: ${request.url},
       Headers: ${JSON.stringify(request.headers)},
       Body: ${JSON.stringify(request.data)}
       Response: 
       Code: ${response.status},
       Body: ${body ?? 'Empty response'},
       Headers: ${JSON.stringify(response.headers)},
       Reason: ${response.statusText}`,
            logger.createCtx(requestDto.getDebugInfo()),
        );
    }

    private async sendMetrics(dto: RequestDto, startTimes: IStartMetrics): Promise<void> {
        const info = dto.getDebugInfo();
        try {
            const times = Metrics.getTimes(startTimes);
            await this.metrics.sendCurlMetrics(
                times,
                info.getHeader(NODE_ID),
                info.getHeader(CORRELATION_ID),
                info.getHeader(USER),
                info.getHeader(APPLICATION),
            ).catch((e) => logger.error(e?.message ?? e, info));
        } catch (e) {
            if (typeof e === 'string') {
                logger.error(e, info);
            }
        }
    }

}
