import { BodyInit, HeaderInit } from 'node-fetch';
import AProcessDto from '../Utils/AProcessDto';
import HttpMethods from './HttpMethods';

export interface IRequestDto {
    getUrl(): string;
    getMethod(): HttpMethods;
    getBody(): BodyInit | undefined;
    getHeaders(): HeaderInit;
    getTimeout(): number;
    getDebugInfo(): AProcessDto | undefined;
}
