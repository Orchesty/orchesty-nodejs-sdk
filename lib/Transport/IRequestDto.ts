import { BodyInit, HeaderInit } from 'node-fetch';
import AProcessDto from '../Utils/AProcessDto';
import HttpMethods from './HttpMethods';

export interface IRequestDto {
    url: string;
    method: HttpMethods;
    body?: BodyInit;
    headers: HeaderInit;
    timeout: number;
    debugInfo: AProcessDto | undefined;
}
