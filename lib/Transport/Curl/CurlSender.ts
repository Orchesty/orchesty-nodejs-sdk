import fetch, { FetchError, RequestInit, Response } from 'node-fetch';
import OnRepeatException from '../../Exception/OnRepeatException';
import OnStopAndFailException from '../../Exception/OnStopAndFailException';
import logger from '../../Logger/Logger';
import Severity from '../../Logger/Severity';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';
import { APPLICATION, CORRELATION_ID, NODE_ID, USER } from '../../Utils/Headers';
import ResultCode from '../../Utils/ResultCode';
import { AllowedCode } from './HttpCodes';
import RequestDto from './RequestDto';
import ResponseDto from './ResponseDto';

export default class CurlSender {

    public constructor(private readonly metrics: Metrics) {
    }

    public async send<JsonBody = unknown>(
        dto: RequestDto,
        allowedCodes?: AllowedCode[],
        sec = 60,
        hops = 10,
        // eslint-disable-next-line @typescript-eslint/require-await
        logMessageCallback = async (res: Response, body: string) => `status: ${res.status}, body: ${body}`,
    ): Promise<ResponseDto<JsonBody>> {
        const startTime = Metrics.getCurrentMetrics();
        try {
            const req = CurlSender.createInitFromDto(dto);
            logger.log(
                Severity.DEBUG,
                `Request send.
       Method: ${dto.getMethod()},
       Url: ${dto.getUrl()},
       Headers: ${JSON.stringify(dto.getHeaders())},
       Body: ${dto.getBody()}`,
                logger.createCtx(dto.getDebugInfo()),
            );
            const response = await fetch(dto.getUrl(), req);
            await this.sendMetrics(dto, startTime);
            const buffer = await response.buffer();
            const body = buffer.toString();
            if (!response.ok) {
                CurlSender.log(dto, response, Severity.ERROR, body);
            } else {
                CurlSender.log(dto, response, Severity.DEBUG, body);
            }

            for (const code of allowedCodes ?? []) {
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
        } catch (e) {
            await this.sendMetrics(dto, startTime);
            if (e instanceof Error) {
                logger.error(e.message, dto.getDebugInfo());
            }

            if (e instanceof FetchError) {
                if (e.message.includes('network timeout')) {
                    throw new OnRepeatException(sec, hops, e.message);
                }
            }

            throw e;
        }
    }

    private static createInitFromDto(dto: RequestDto): RequestInit {
        const req: RequestInit = {
            method: dto.getMethod(),
            headers: dto.getHeaders(),
            timeout: dto.getTimeout(),
        };

        if (dto.getBody() !== undefined) {
            req.body = dto.getBody();
        }

        return req;
    }

    private static log(dto: RequestDto, res: Response, level: Severity, body?: string): void {
        let message = 'Request success.';
        if (res.status > 300) {
            message = 'Request failed.';
        }

        logger.log(
            level,
            `${message}
       Code: ${res.status},
       Body: ${body ?? 'Empty response'},
       Headers: ${JSON.stringify(res.headers.raw())},
       Reason: ${res.statusText}`,
            logger.createCtx(dto.getDebugInfo()),
        );
    }

    private returnResponseDto<JsonBody>(body: string, response: Response, buffer: Buffer): ResponseDto<JsonBody> {
        return new ResponseDto(body, response.status, response.headers, buffer, response.statusText);
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
