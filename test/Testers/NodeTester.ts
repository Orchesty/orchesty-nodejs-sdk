import fs from 'fs';
import path from 'path';
import { APPLICATION_PREFIX } from '../../lib/Application/ApplicationRouter';
import { BATCH_PREFIX } from '../../lib/Batch/BatchRouter';
import { INode } from '../../lib/Commons/INode';
import { CONNECTOR_PREFIX } from '../../lib/Connector/ConnectorRouter';
import { CUSTOM_NODE_PREFIX } from '../../lib/CustomNode/CustomNodeRouter';
import DIContainer from '../../lib/DIContainer/Container';
import AProcessDto from '../../lib/Utils/AProcessDto';
import BatchProcessDto from '../../lib/Utils/BatchProcessDto';
import { RESULT_CODE, RESULT_MESSAGE } from '../../lib/Utils/Headers';
import ProcessDto from '../../lib/Utils/ProcessDto';
import { isBatchResultCode } from '../../lib/Utils/ResultCode';
import { IDtoData, mockNodeCurl, walkRecursive } from './TesterHelpers';

export default class NodeTester {

    public constructor(
        private readonly container: DIContainer,
        private readonly file: string,
        private readonly forceMock = false,
        private readonly exclude?: string[],
    ) {
    }

    public async testConnector(
        nodeName: string,
        prefix = '',
        exceptedError?: unknown,
    ): Promise<void> {
        await this.testNode(nodeName, CONNECTOR_PREFIX, prefix, exceptedError);
    }

    public async testBatch(
        nodeName: string,
        prefix = '',
        exceptedError?: unknown,
    ): Promise<void> {
        await this.testNode(nodeName, BATCH_PREFIX, prefix, exceptedError);
    }

    public async testCustomNode(
        nodeName: string,
        prefix = '',
        exceptedError?: unknown,
    ): Promise<void> {
        await this.testNode(nodeName, CUSTOM_NODE_PREFIX, prefix, exceptedError);
    }

    public async testApplication(
        nodeName: string,
        prefix = '',
        exceptedError?: unknown,
    ): Promise<void> {
        await this.testNode(nodeName, APPLICATION_PREFIX, prefix, exceptedError);
    }

    private async testNode(
        nodeName: string,
        nodePrefix: string,
        _prefix = '',
        expectedError?: unknown,
        _index = 0,
        _batchProcessDto: AProcessDto = new BatchProcessDto(),
    ): Promise<void> {
        const prefix = _prefix !== '' ? `${_prefix}-` : '';
        const node: INode = this.container.getNamed(`${nodePrefix}.${nodeName}`);
        const fileName = path.parse(this.file).name;
        const fileDir = path.parse(this.file).dir;
        let thrownErr: unknown;
        const index = _index !== 0 ? `${_index}` : '';

        const input = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}input.json`)
            .toString()) as IDtoData;
        const output = JSON.parse(fs.readFileSync(`${fileDir}/Data/${fileName}/${prefix}output${index}.json`)
            .toString()) as IDtoData;

        mockNodeCurl(
            node,
            this.file,
            _prefix,
            _index,
            this.forceMock,
            this.exclude,
        );

        let dto;
        if (nodePrefix === BATCH_PREFIX) {
            dto = _batchProcessDto as BatchProcessDto;
            dto.setBridgeData(JSON.stringify(input.data));
        } else {
            dto = new ProcessDto();
            dto.setJsonData(input.data);
        }
        dto.setHeaders({ ...input.headers, ...dto.getHeaders() });

        try {
            const res = await node.processAction(dto);
            let resData = dto.getJsonData();
            if (nodePrefix === BATCH_PREFIX) {
                resData = JSON.parse(dto.getBridgeData() as string);
            }

            if (output.replacement?.data) {
                Object.keys(output.replacement?.data).forEach((key) => {
                    const keys = key.split('.');
                    resData = walkRecursive(
                        resData,
                        keys,
                        output.replacement?.data ? output.replacement?.data[key] : '',
                    );
                });
            }

            /* eslint-disable-next-line jest/no-standalone-expect */
            expect(res.getHeaders()).toEqual(output.headers);
            /* eslint-disable-next-line jest/no-standalone-expect */
            expect(resData).toEqual(output.data);

            if (nodePrefix === BATCH_PREFIX && isBatchResultCode(Number(res.getHeader(RESULT_CODE)))) {
                res.removeHeader(RESULT_CODE);
                res.removeHeader(RESULT_MESSAGE);
                const newDto = new BatchProcessDto();
                newDto.setHeaders(res.getHeaders());
                await this.testNode(nodeName, nodePrefix, _prefix, expectedError, _index + 1, newDto);
            }
        } catch (e) {
            if (!expectedError) {
                throw e;
            } else {
                /* eslint-disable-next-line jest/no-standalone-expect */
                expect(e).toBeInstanceOf(expectedError);
                thrownErr = e;
            }
        } finally {
            if (expectedError && !thrownErr) {
                // eslint-disable-next-line no-unsafe-finally
                throw new Error(`Error [${typeof expectedError}] expected but non thrown.`);
            }
        }
    }

}
