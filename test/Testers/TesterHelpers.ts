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
}

export interface IDtoData {
  headers: { [key: string]: string },
  data: Record<string, unknown>,
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

export function mockCurl(
  node: ICommonNode|AConnector,
  file: string,
  sender: CurlSender,
  _prefix = '',
  _index = 0,
): SpyInstance | undefined {
  if (Reflect.has(node, 'sender') && Reflect.get(node, 'sender') !== undefined) {
    const prefix = _prefix !== '' ? `${_prefix}-` : '';
    const index = _index !== 0 ? `${_index}-` : '';
    const fileName = path.parse(file).name;
    const fileDir = path.parse(file).dir;
    const curl = JSON.parse(
      fs.readFileSync(`${fileDir}/Data/${fileName}/${index}${prefix}mock.json`).toString(),
    ) as ICurlMock;

    return jest.spyOn(sender, 'send')
      .mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (r: RequestDto): Promise<ResponseDto> => {
          const request = r as RequestDto;
          const [method, url] = curl.http.split(' ', 2);
          expect(request.method).toBe(method);
          expect(request.url).toBe(url);

          return new ResponseDto(
            JSON.stringify(curl.body || {}),
            curl.code || 200,
            new Headers(curl.headers || new Headers()),
          );
        },
      );
  }
  return undefined;
}
