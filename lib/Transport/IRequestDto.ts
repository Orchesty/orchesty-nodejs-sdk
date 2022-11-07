import AProcessDto from '../Utils/AProcessDto';
import { HttpMethods } from './HttpMethods';

export interface IRequestDto {
    getUrl(): string;
    getMethod(): HttpMethods;
    getBody(): unknown;
    getHeaders(): Record<string, unknown>;
    getTimeout(): number;
    getDebugInfo(): AProcessDto | undefined;
}
