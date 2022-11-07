import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { INode } from '../../lib/Commons/INode';
import AConnector from '../../lib/Connector/AConnector';

export interface ICurlMock {
    body: Record<string, unknown> | string;
    code: number;
    http: string;
    headers: Record<string, string>;
    httpReplacement?: {
        query?: Record<string, string>;
        path?: Record<string, string>;
    };
}

export interface IDtoData {
    headers: Record<string, string>;
    data: Record<string, unknown>;
    replacement?: {
        data?: Record<string, string>;
    };
}

export interface ILightNode {
    name: string;
    id: string;
}

export class TestNode implements ILightNode {

    public constructor(
        public id: string,
        public name: string,
        public type: string,
        public previous: ILightNode[] = [],
        public followers: ILightNode[] = [],
    ) {
    }

    public toWorkerFollowerHeader(): { id: string; name: string }[] {
        const res: { id: string; name: string }[] = [];
        this.followers.forEach((f) => res.push({ id: f.id, name: f.name }));

        return res;
    }

    public reduceFollowersByHeader(...forceTargetQueues: string[]): ILightNode[] {
        return this.followers.filter((f) => forceTargetQueues.includes(f.id));
    }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function walkRecursive(body: any, keys: string[], value: string): any {
    const first = keys.shift();
    if (first && body[first]) {
        // eslint-disable-next-line no-param-reassign
        body[first] = walkRecursive(body[first], keys, value);
    } else if (first && !body[first]) {
        // Ignore key if not exist in output data
        return body;
    } else {
        // eslint-disable-next-line no-param-reassign
        body = value;
    }
    return body;
}

export function mockCurl(
    file: string,
    _prefix = '',
    _index = 0,
): MockAdapter {
    const prefix = _prefix !== '' ? `${_prefix}-` : '';
    const index = _index !== 0 ? `${_index}-` : '';
    const fileName = path.parse(file).name;
    const fileDir = path.parse(file).dir;

    const mockAdapter = new MockAdapter(axios, { onNoMatch: 'throwException' });
    let mockFile = `${fileDir}/Data/${fileName}/${index}${prefix}mock.json`;
    let call = 0;
    do {
        const curl = JSON.parse(fs.readFileSync(mockFile).toString()) as ICurlMock;
        const [method, url] = curl.http.split(' ', 2);
        let requestHandler;
        switch (method.toLowerCase()) {
            case 'get':
                requestHandler = mockAdapter.onGet(new RegExp(url));
                break;
            case 'post':
                requestHandler = mockAdapter.onPost(new RegExp(url));
                break;
            case 'put':
                requestHandler = mockAdapter.onPut(new RegExp(url));
                break;
            case 'patch':
                requestHandler = mockAdapter.onPatch(new RegExp(url));
                break;
            case 'delete':
                requestHandler = mockAdapter.onDelete(new RegExp(url));
                break;
            default:
                requestHandler = mockAdapter.onAny(new RegExp(url));
                break;
        }

        requestHandler.replyOnce(curl.code, Buffer.from(JSON.stringify(curl.body)), curl.headers);

        call += 1;
        mockFile = `${fileDir}/Data/${fileName}/${index}${prefix}mock${call}.json`;
    } while (fs.existsSync(mockFile));

    return mockAdapter;
}

export function mockNodeCurl(
    node: AConnector | INode,
    file: string,
    _prefix = '',
    _index = 0,
    _forceMock = false,
    _exclude: string[] = [],
): MockAdapter | undefined {
    if (_forceMock && !_exclude.includes(_prefix)) {
        return mockCurl(file, _prefix, _index);
    }

    if (
        Reflect.has(node, 'sender')
        && Reflect.get(node, 'sender') !== undefined
        && !_exclude.includes(_prefix)
    ) {
        return mockCurl(file, _prefix, _index);
    }

    return undefined;
}
