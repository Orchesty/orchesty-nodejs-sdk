import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import OnRepeatException from '../../Exception/OnRepeatException';
import OnStopAndFailException from '../../Exception/OnStopAndFailException';
import logger from '../../Logger/Logger';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';
import { getCorrelationId, getNodeId, getUserId } from '../../Utils/Headers';
import RequestDto from './RequestDto';
import ResponseDto from './ResponseDto';
import { defaultRanges, inRange, IResultRanges, StatusRange } from './ResultCodeRange';

export default class CurlSender {

    public constructor(private readonly metrics: Metrics) {
    }

    /**
     * Default range:
     *
     *     {
     *         success: '<300',
     *         stopAndFail: ['300-408', '409-500'],
     *         repeat: [408, '>=500'],
     *     }
     *
     * When a single range is sent, it's parsed as success states
     * '200-300' - left inclusive
     * [200, 201] - specific codes
     * '>=400' - allowed prefixes '>=', '<=', '>', '<'
     * 200 - single number
     * [200, '>=400'] - mix of different types in array
     */
    public async send<JsonBody = unknown>(
        dto: RequestDto,
        codeRanges: IResultRanges | StatusRange | null = defaultRanges,
        sec = 60,
        hops = 10,
        // eslint-disable-next-line @typescript-eslint/require-await
        logMessageCallback = async (res: AxiosResponse, body: string) => `status: ${res.status}, body: ${body}`,
    ): Promise<ResponseDto<JsonBody>> {
        const startTime = Metrics.getCurrentMetrics();
        try {
            const req = CurlSender.createInitFromDto(dto);
            const response = await axios(dto.getUrl(), req);
            const buffer = await response.data;
            const body = buffer?.toString() ?? '';
            CurlSender.log(dto, req, response, body);
            await this.sendMetrics(dto, startTime, response.status);

            if (codeRanges) {
                return await this.handleByResultCode(
                    response,
                    body,
                    buffer,
                    codeRanges,
                    logMessageCallback,
                    sec,
                    hops,
                );
            }

            return this.returnResponseDto(body, response, buffer);
        } catch (e) {
            if (e instanceof Error) {
                logger.error(e.message, dto.getDebugInfo());
            }

            if (e instanceof AxiosError) {
                if (e.message.includes('timeout')) {
                    await this.sendMetrics(dto, startTime, 408);
                    throw new OnRepeatException(sec, hops, e.message);
                }
            }

            await this.sendMetrics(dto, startTime, 500);

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
        codeRanges: IResultRanges | StatusRange,
        logMessageCallback: (res: AxiosResponse, body: string) => Promise<string>,
        sec?: number,
        hops?: number,
    ): Promise<ResponseDto<JsonBody>> {
        const { status } = response;
        if (!Array.isArray(codeRanges) && typeof codeRanges === 'object') {
            const ranges = codeRanges;
            if (ranges.success && inRange(status, ranges.success)) {
                return this.returnResponseDto(body, response, buffer);
            }
            if (ranges.stopAndFail && inRange(status, ranges.stopAndFail)) {
                throw new OnStopAndFailException(await logMessageCallback(response, body));
            }
            if (ranges.repeat && inRange(status, ranges.repeat)) {
                throw new OnRepeatException(sec, hops, await logMessageCallback(response, body));
            }
        } else if (inRange(status, codeRanges)) {
            return this.returnResponseDto(body, response, buffer);
        }

        if (status < 300) {
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

        if (dto.getAuth() !== undefined) {
            req.auth = dto.getAuth();
        }

        return req;
    }

    private static log<T = unknown>(
        requestDto: RequestDto,
        request: AxiosRequestConfig,
        response: AxiosResponse<T>,
        body: string,
    ): void {
        const message = `Method: ${request.method},
       Url: ${request.url},
       Headers: ${JSON.stringify(request.headers)},
       Body: ${JSON.stringify(request.data)}
       Response: 
       Code: ${response.status},
       Body: ${body ?? 'Empty response'},
       Headers: ${JSON.stringify(response.headers)},
       Reason: ${response.statusText}`;

        if (response.status > 300) {
            logger.error(`Request failed. ${message}`, logger.createCtx(requestDto.getDebugInfo()));
        } else {
            logger.debug(`Request success. ${message}`, logger.createCtx(requestDto.getDebugInfo()));
        }
    }

    private async sendMetrics(dto: RequestDto, startTimes: IStartMetrics, responseCode: number): Promise<void> {
        const info = dto.getDebugInfo();
        const times = Metrics.getTimes(startTimes);
        await this.metrics.sendCurlMetrics(
            times,
            responseCode,
            getUserId(info.getHeaders()),
            getNodeId(info.getHeaders()),
            info.getCurrentApp(),
            getCorrelationId(info.getHeaders()),
            dto.getUrl(),
        ).catch((e) => logger.error(e?.message ?? 'Metrics: unknown error', info, false, e));
    }

}
