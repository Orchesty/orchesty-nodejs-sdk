import path from 'path';
import fs from 'fs';
import DIContainer from '../../lib/DIContainer/Container';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { IDtoData, mockCurl } from './TesterHelpers';
import AConnector from '../../lib/Connector/AConnector';
import CoreServices from '../../lib/DIContainer/CoreServices';
import { CONNECTOR_PREFIX } from '../../lib/Connector/ConnectorRouter';
import { APPLICATION_PREFIX } from '../../lib/Application/ApplicationRouter';
import { CUSTOM_NODE_PREFIX } from '../../lib/CustomNode/CustomNodeRouter';
import { BATCH_PREFIX } from '../../lib/Batch/BatchRouter';

export default class NodeTester {
  constructor(private _container: DIContainer, private _file: string) {
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

    const input = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}input.json`)
      .toString()) as IDtoData;
    const output = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}output.json`)
      .toString()) as IDtoData;

    const spy = mockCurl(node, this._file, this._container.get(CoreServices.CURL), _prefix);
    const dto = new ProcessDto();
    dto.jsonData = input.data;
    dto.headers = input.headers;

    try {
      const res = await node.processAction(dto);
      expect(res.headers).toEqual(output.headers);
      expect(res.jsonData).toEqual(output.data);
    } catch (e) {
      if (!expectedError) {
        throw e;
      } else {
        expect(e).toBeInstanceOf(expectedError);
      }
    } finally {
      if (spy) {
        spy.mockRestore();
      }
    }
  }
}
