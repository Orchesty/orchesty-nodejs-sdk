import { HeaderInit } from 'node-fetch';
import ProcessDto from '../Utils/ProcessDto';
import HttpMethods from './HttpMethods';

export interface IRequestDto {
    url: string;
    method: HttpMethods;
    body: string;
    headers: HeaderInit;
    timeout: number;
    debugInfo: ProcessDto | undefined;
}
