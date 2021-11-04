import { BodyInit, HeaderInit } from 'node-fetch';
import ProcessDto from '../Utils/ProcessDto';
import HttpMethods from './HttpMethods';

export interface IRequestDto {
    url: string;
    method: HttpMethods;
    body?: BodyInit;
    headers: HeaderInit;
    timeout: number;
    debugInfo: ProcessDto | undefined;
}
