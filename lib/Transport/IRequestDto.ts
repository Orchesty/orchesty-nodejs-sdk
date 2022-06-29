import { BodyInit, HeaderInit } from 'node-fetch';
import HttpMethods from './HttpMethods';
import AProcessDto from '../Utils/AProcessDto';

export interface IRequestDto {
    url: string;
    method: HttpMethods;
    body?: BodyInit;
    headers: HeaderInit;
    timeout: number;
    debugInfo: AProcessDto | undefined;
}
