import path from 'path';
import fs from 'fs';
import DIContainer from '../../lib/DIContainer/Container';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { IDtoData, mockNodeCurl, walkRecursive } from './TesterHelpers';
import AConnector from '../../lib/Connector/AConnector';
import CoreServices from '../../lib/DIContainer/CoreServices';
import { CONNECTOR_PREFIX } from '../../lib/Connector/ConnectorRouter';
import { APPLICATION_PREFIX } from '../../lib/Application/ApplicationRouter';
import { CUSTOM_NODE_PREFIX } from '../../lib/CustomNode/CustomNodeRouter';
import { BATCH_PREFIX } from '../../lib/Batch/BatchRouter';
import BatchProcessDto from '../../lib/Utils/BatchProcessDto';

export default class NodeTester {
  constructor(private _container: DIContainer, private _file: string, private _forceMock = false) {
  }

  public async testConnector(
    nodeName: string,
    prefix = '',
    exceptedError?: unknown,
  ): Promise<void> {
    await this._testNode(nodeName, CONNECTOR_PREFIX, prefix, exceptedError);
  }

  public async testBatch(
    nodeName: string,
    prefix = '',
    exceptedError?: unknown,
  ): Promise<void> {
    await this._testNode(nodeName, BATCH_PREFIX, prefix, exceptedError);
  }

  public async testCustomNode(
    nodeName: string,
    prefix = '',
    exceptedError?: unknown,
  ): Promise<void> {
    await this._testNode(nodeName, CUSTOM_NODE_PREFIX, prefix, exceptedError);
  }

  public async testApplication(
    nodeName: string,
    prefix = '',
    exceptedError?: unknown,
  ): Promise<void> {
    await this._testNode(nodeName, APPLICATION_PREFIX, prefix, exceptedError);
  }

  private async _testNode(
    nodeName: string,
    nodePrefix: string,
    _prefix = '',
    expectedError?: unknown,
  ): Promise<void> {
    const prefix = _prefix !== '' ? `${_prefix}-` : '';
    const node = this._container.get(`${nodePrefix}.${nodeName}`) as AConnector;
    const fileName = path.parse(this._file).name;
    const fileDir = path.parse(this._file).dir;
    let thrownErr: unknown;

    const input = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}input.json`)
      .toString()) as IDtoData;
    const output = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}output.json`)
      .toString()) as IDtoData;

    const spy = mockNodeCurl(node, this._file, this._container.get(CoreServices.CURL), _prefix, 0, this._forceMock);
    let dto;
    if (nodePrefix === BATCH_PREFIX) {
      dto = new BatchProcessDto();
      dto.setBridgeData(JSON.stringify(input.data));
    } else {
      dto = new ProcessDto();
      dto.jsonData = input.data;
    }
    dto.headers = input.headers;

    try {
      const res = await node.processAction(dto);
      let resData = dto.jsonData;
      if (nodePrefix === BATCH_PREFIX) {
        resData = JSON.parse(dto.getBridgeData() as string);
      }

      if (output.replacement?.data) {
        Object.keys(output.replacement?.data).forEach((_key) => {
          const keys = _key.split('.');
          resData = walkRecursive(resData, keys, output.replacement?.data ? output.replacement?.data[_key] : '');
        });
      }

      expect(res.headers).toEqual(output.headers);
      expect(resData).toEqual(output.data);
    } catch (e) {
      if (!expectedError) {
        throw e;
      } else {
        expect(e).toBeInstanceOf(expectedError);
        thrownErr = e;
      }
    } finally {
      spy?.mockRestore();
      if (expectedError && !thrownErr) {
        // eslint-disable-next-line no-unsafe-finally
        throw new Error(`Error [${expectedError}] expected but non thrown.`);
      }
    }
  }
}
