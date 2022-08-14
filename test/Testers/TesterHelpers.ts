import path from 'path';
import fs from 'fs';
import { Headers, Response } from 'node-fetch';
import { unescape } from 'querystring';
import { INode } from '../../lib/Commons/INode';
import AConnector from '../../lib/Connector/AConnector';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import ResponseDto from '../../lib/Transport/Curl/ResponseDto';
import SpyInstance = jest.SpyInstance;
import CurlSender from '../../lib/Transport/Curl/CurlSender';
import OnRepeatException from '../../lib/Exception/OnRepeatException';

export interface ICurlMock {
  body: Record<string, unknown>|string,
  code: number,
  http: string,
  headers: Record<string, string>,
  httpReplacement?:
  {
    query?: Record<string, string>
    path?: Record<string, string>
  },
}

export interface IDtoData {
  headers: Record<string, string>,
  data: Record<string, unknown>,
  replacement?: {
    data?: Record<string, string>
  }
}

export interface ILightNode {
  name: string,
  id: string,
}

export class TestNode implements ILightNode {
  public constructor(
    public id: string,
    public name: string,
    public type: string,
    public previous: ILightNode[] = [],
    public followers: ILightNode[] = [],
  ) {}

  public toWorkerFollowerHeader(): {id: string; name: string}[] {
    const res: {id: string; name: string}[] = [];
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
  sender: CurlSender,
  _prefix = '',
  _index = 0,
): SpyInstance | undefined {
  const prefix = _prefix !== '' ? `${_prefix}-` : '';
  const index = _index !== 0 ? `${_index}-` : '';
  const fileName = path.parse(file).name;
  const fileDir = path.parse(file).dir;
  let spy = jest.spyOn(sender, 'send');
  let mockFile = `${fileDir}/Data/${fileName}/${index}${prefix}mock.json`;
  let call = 0;

  do {
    const curl = JSON.parse(fs.readFileSync(mockFile).toString()) as ICurlMock;
    spy = spy.mockImplementationOnce(
      // eslint-disable-next-line @typescript-eslint/require-await,no-loop-func,@typescript-eslint/no-explicit-any
      async (r: RequestDto, aC?: number[], s?: number, h?: number, mC?: any): Promise<ResponseDto> => {
        const request = r as RequestDto;
        const [method, url] = curl.http.split(' ', 2);
        try {
          expect(request.method).toBe(method);
        } catch (e) {
          throw new Error(`HTTP Method for [${index}${_prefix}] should be [${method}], [${request.method}] received.`);
        }

        let expectedUrl = request.url;
        try {
          if (curl.httpReplacement?.query) {
            const replacedUrl = new URL(expectedUrl);
            Object.keys(curl.httpReplacement?.query).forEach((key) => {
              replacedUrl.searchParams.set(
                key,
                curl.httpReplacement?.query ? curl.httpReplacement.query[key].toString() : '',
              );
            });
            expectedUrl = unescape(replacedUrl.toString());
          }
          expect(expectedUrl).toBe(url);
        } catch (e) {
          throw new Error(`URL for [${index}${_prefix}] should be [${url}], [${expectedUrl}] received.`);
        }

        let newBody = '';
        if (typeof curl.body === 'string') {
          newBody = curl.body;
        } else {
          newBody = JSON.stringify(curl.body || {});
        }

        if (aC && !aC.includes(curl.code || 200)) {
          if (!mC) {
            // eslint-disable-next-line no-param-reassign
            mC = (res: Response, body: string) => body;
          }

          throw new OnRepeatException(s ?? 60, h ?? 10, mC(new Response(newBody), newBody));
        }

        return new ResponseDto(
          newBody,
          curl.code || 200,
          new Headers(curl.headers || new Headers()),
        );
      },
    );
    call += 1;
    mockFile = `${fileDir}/Data/${fileName}/${index}${prefix}mock${call}.json`;
  } while (fs.existsSync(mockFile));

  return spy;
}

export function mockNodeCurl(
  node: INode|AConnector,
  file: string,
  sender: CurlSender,
  _prefix = '',
  _index = 0,
  _forceMock = false,
  _exclude: string[] = [],
): SpyInstance | undefined {
  if (_forceMock && !_exclude.includes(_prefix)) {
    return mockCurl(file, sender, _prefix, _index);
  }

  if (
    Reflect.has(node, 'sender')
    && Reflect.get(node, 'sender') !== undefined
    && !_exclude.includes(_prefix)
  ) {
    return mockCurl(file, sender, _prefix, _index);
  }

  return undefined;
}
