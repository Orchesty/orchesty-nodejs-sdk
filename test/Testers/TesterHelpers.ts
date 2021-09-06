import path from 'path';
import fs from 'fs';
import { Headers } from 'node-fetch';
import { ICommonNode } from '../../lib/Commons/ICommonNode';
import AConnector from '../../lib/Connector/AConnector';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import ResponseDto from '../../lib/Transport/Curl/ResponseDto';
import SpyInstance = jest.SpyInstance;
import CurlSender from '../../lib/Transport/Curl/CurlSender';

export interface ICurlMock {
  body: Record<string, unknown>,
  code: number,
  http: string,
  headers: { [key: string]: string },
  httpReplacement?:
    {
      query?: Record<string, string>
      path?: Record<string, string>
    },
}

export interface IDtoData {
  headers: { [key: string]: string },
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
  id: string;

  name: string;

  type: string;

  previous: ILightNode[] = [];

  followers: ILightNode[] = [];

  constructor(id: string, name: string, type: string) {
    this.id = id;
    this.name = name;
    this.type = type;
  }

  public toWorkerFollowerHeader(): {id: string; name: string}[] {
    const res: {id: string; name: string}[] = [];
    this.followers.forEach((f) => res.push({ id: f.id, name: f.name }));

    return res;
  }

  public reduceFollowersByHeader(forceTargetQueue: string): ILightNode[] {
    return this.followers.filter((f) => f.id === forceTargetQueue);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function walkRecursive(body: any, keys: string[], value: string): any {
  const first = keys.shift();
  if (first && body[first]) {
    // eslint-disable-next-line no-param-reassign
    body[first] = walkRecursive(body[first], keys, value);
  } else if (first && !body[first]) {
    // Ignore key if don't exist in output data
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
      // eslint-disable-next-line @typescript-eslint/require-await,no-loop-func
      async (r: RequestDto): Promise<ResponseDto> => {
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

        return new ResponseDto(
          JSON.stringify(curl.body || {}),
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
  node: ICommonNode|AConnector,
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

  if (Reflect.has(node, 'sender') && Reflect.get(node, 'sender') !== undefined) {
    return mockCurl(file, sender, _prefix, _index);
  }
  return undefined;
}
