import fetch, { FetchError, RequestInit, Response } from 'node-fetch';
import OnRepeatException from '../../Exception/OnRepeatException';
import logger from '../../Logger/Logger';
import Severity from '../../Logger/Severity';
import Metrics, { IStartMetrics } from '../../Metrics/Metrics';
import { APPLICATION, CORRELATION_ID, NODE_ID, USER } from '../../Utils/Headers';
import RequestDto from './RequestDto';
import ResponseDto from './ResponseDto';

export default class CurlSender {

    public constructor(private readonly metrics: Metrics) {
    }

    public async send<JsonBody = unknown>(
        dto: RequestDto,
        allowedCodes?: number[],
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
            const body = await response.text();
            if (!response.ok) {
                CurlSender.log(dto, response, Severity.ERROR, body);
            } else {
                CurlSender.log(dto, response, Severity.DEBUG, body);
            }

            if (allowedCodes && !allowedCodes.includes(response.status)) {
                throw new OnRepeatException(sec, hops, await logMessageCallback(response, body));
            }

            return new ResponseDto(body, response.status, response.headers, response.statusText);
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
