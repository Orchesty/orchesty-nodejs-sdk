// eslint-disable-next-line max-classes-per-file
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import { INode } from '../../lib/Commons/INode';
import DIContainer from '../../lib/DIContainer/Container';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import AProcessDto from '../../lib/Utils/AProcessDto';
import BatchProcessDto from '../../lib/Utils/BatchProcessDto';
import {
    BATCH_CURSOR,
    FORCE_TARGET_QUEUE,
    REPEAT_HOPS,
    REPEAT_MAX_HOPS,
    RESULT_CODE,
    RESULT_MESSAGE,
    WORKER_FOLLOWERS,
} from '../../lib/Utils/Headers';
import ProcessDto from '../../lib/Utils/ProcessDto';
import ResultCode from '../../lib/Utils/ResultCode';
import { mockNodeCurl, TestNode } from './TesterHelpers';

export default class TopologyTester {

    private nodes: TestNode[] = [];

    public constructor(
        private readonly container: DIContainer,
        private readonly file: string,
        private readonly forceMock = false,
        private readonly excludeList: string[] = [],
    ) {
    }

    public async runTopology(
        topologyPath: string,
        dto: ProcessDto,
        prefix = '',
        startingPoint?: string,
    ): Promise<AProcessDto[]> {
        // Parse BPMN scheme
        this.nodes = this.parseTopologyFile(topologyPath);

        // Find first nodes
        const starts = this.nodes.filter((node) => node.previous.length <= 0);
        if (starts.length <= 0) {
            throw new Error('Topology has no start nodes!');
        }

        // Iterate over all nodes
        const results: AProcessDto[] = [];
        while (starts.length > 0) {
            const startNode = starts.shift();
            if (startNode) {
                if (startingPoint) {
                    if (startingPoint === startNode.name) {
                        results.push(
                            // eslint-disable-next-line no-await-in-loop
                            ...await this.recursiveRunner(startNode, this.cloneProcessDto(dto), prefix),
                        );
                    }
                } else {
                    results.push(
                        // eslint-disable-next-line no-await-in-loop
                        ...await this.recursiveRunner(startNode, this.cloneProcessDto(dto), prefix),
                    );
                }
            }
        }

        return results;
    }

    private static pushMultiple(nextDto: AProcessDto[], out: BatchProcessDto): void {
        out.getMessages().forEach((message) => {
            const dto = new ProcessDto();
            dto.setData(message.body);
            dto.setHeaders({
                ...out.getHeaders(),
                ...message.headers ?? {},
            });
            dto.removeHeader(BATCH_CURSOR);

            nextDto.push(dto);
        });

        if ((out.getJsonData() as unknown[]).length <= 0) {
            nextDto.push(out);
        }
    }

    private parseTopologyFile(path: string): TestNode[] {
        const buff = fs.readFileSync(path);
        const res = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(buff.toString());

        // Parse a compile TestNodes
        const nodes: TestNode[] = [];

        this.pushNodes(res.definitions.process.task as Record<string, string>[], nodes);
        this.pushNodes(res.definitions.process.event as Record<string, string>[], nodes);

        let { sequenceFlow } = res.definitions.process;
        if (!Array.isArray(sequenceFlow)) {
            sequenceFlow = [sequenceFlow];
        }

        (sequenceFlow as Record<string, string>[]).forEach((line: Record<string, string>) => {
            const from = nodes.findIndex((node) => node.id === line['@_sourceRef']);
            const to = nodes.findIndex((node) => node.id === line['@_targetRef']);

            if (from >= 0) {
                nodes[from].followers.push({ id: nodes[to].id, name: nodes[to].name });
                nodes[to].previous.push({ id: nodes[from].id, name: nodes[from].name });
            }
        });

        return nodes;
    }

    private pushNodes(_srcList: Record<string, string>[], dstList: TestNode[]): void {
        let list = _srcList;
        if (!Array.isArray(list)) {
            list = [list];
        }

        list.forEach((event: Record<string, string>) => {
            dstList.push(
                new TestNode(event['@_id'], event['@_name'], event['@_pipesType']),
            );
        });
    }

    private async recursiveRunner(
        node: TestNode,
        dto: AProcessDto,
        prefix: string,
        _index = 0,
    ): Promise<AProcessDto[]> {
        // Get worker instance from container
        let worker: INode | null;
        switch (node.type) {
            case 'connector':
                worker = this.container.getConnector(node.name);
                break;
            case 'batch':
                worker = this.container.getBatch(node.name);
                break;
            case 'custom':
                worker = this.container.getCustomNode(node.name);
                break;
            case 'start':
            case 'cron':
            case 'webhook':
                worker = null;
                break;
            default:
                throw new Error(`Unsupported node type [${node.type}]`);
        }

        let index = _index;
        if (index >= 255) {
            throw new Error(`Node [${node.name}] has reached [${index}] iterations. Process has been stopped!`);
        }

        dto.addHeader(WORKER_FOLLOWERS, JSON.stringify(node.toWorkerFollowerHeader()));
        dto.removeHeader(RESULT_MESSAGE);

        const nextDto: AProcessDto[] = [];
        let out: AProcessDto;
        try {
            if (worker) {
                out = await this.processAction(
                    worker,
                    node,
                    this.cloneProcessDto(dto, undefined, node.type === 'batch'),
                    prefix,
                    index,
                );
            } else {
                out = this.cloneProcessDto(dto);
            }
        } catch (e) {
            if (e instanceof OnRepeatException) {
                out = this.cloneProcessDto(dto);
                out.addHeader(RESULT_CODE, ResultCode.REPEAT.toString());
                out.addHeader(REPEAT_MAX_HOPS, e.getMaxHops().toString());
            } else {
                throw e;
            }
        }

        let { followers } = node;
        const results: AProcessDto[] = [];
        switch (out.getHeader(RESULT_CODE)) {
            // Status has not provided => success
            case undefined:
                if (node.type === 'batch') {
                    TopologyTester.pushMultiple(nextDto, out as BatchProcessDto);
                } else {
                    nextDto.push(out);
                }
                break;
            // Success end and exit
            case ResultCode.DO_NOT_CONTINUE.toString():
                results.push(out);
                return results;
            // Re routing
            case ResultCode.FORWARD_TO_TARGET_QUEUE.toString():
                followers = node.reduceFollowersByHeader(...(out.getHeader(FORCE_TARGET_QUEUE) ?? '').split(','));
                nextDto.push(out);
                break;
            // Message want to be repeated
            case ResultCode.REPEAT.toString():
                index += 1;
                dto.addHeader(REPEAT_HOPS, String(parseInt(out.getHeader(REPEAT_HOPS, '0') as string, 10) + 1));
                if (parseInt(out.getHeader(REPEAT_HOPS) ?? '0', 10)
                    >= parseInt(out.getHeader(REPEAT_MAX_HOPS) ?? '0', 10)) {
                    throw new Error('Repeater has used last try and still need to repeat.');
                }
                dto.removeHeader(RESULT_CODE);
                [out] = await this.recursiveRunner(node, this.cloneProcessDto(dto), prefix, index);
                nextDto.push(out);
                break;
            // Repeat batch until cursor ends and send only one message
            case ResultCode.BATCH_CURSOR_ONLY.toString():
                index += 1;
                dto.removeHeader(RESULT_CODE);
                [out] = await this.recursiveRunner(node, this.cloneProcessDto(dto), prefix, index);
                nextDto.push(this.cloneProcessDto(out, {}));
                break;
            // Repeat batch until cursor ends and store message
            case ResultCode.BATCH_CURSOR_WITH_FOLLOWERS.toString():
                TopologyTester.pushMultiple(nextDto, out as BatchProcessDto);
                index += 1;
                dto.removeHeader(RESULT_CODE);
                [out] = await this.recursiveRunner(node, this.cloneProcessDto(dto), prefix, index);
                break;
            default:
                if (out.getHeader(RESULT_CODE) !== '0') {
                    // eslint-disable-next-line max-len
                    throw new Error(`Node [${node.name}] has returned non success result code [${out.getHeader(RESULT_CODE)}].`);
                }
        }

        for (const d of nextDto) {
            // Prepare out ProcessDto for followers
            d.removeRepeater();
            d.removeHeader(RESULT_CODE);

            // Run process on followers
            if (followers.length <= 0) {
                results.push(d);
            } else {
                for (const follower of followers) {
                    const fIndex = this.nodes.findIndex((n) => n.id === follower.id);
                    // eslint-disable-next-line no-await-in-loop
                    results.push(...await this.recursiveRunner(this.nodes[fIndex], this.cloneProcessDto(d), prefix));
                }
            }
        }

        return results;
    }

    private async processAction(
        worker: INode,
        node: TestNode,
        dto: AProcessDto,
        prefix: string,
        index = 0,
    ): Promise<AProcessDto> {
        mockNodeCurl(
            worker,
            this.file,
            `${prefix}${node.id}`,
            index,
            this.forceMock,
            this.excludeList,
        );
        let toProcess = dto;
        if (node.type === 'batch' && dto instanceof ProcessDto) {
            toProcess = this.cloneProcessDto(dto, undefined, true);
        }

        const out = await worker.processAction(toProcess);

        return out;
    }

    private cloneProcessDto(
        dto: AProcessDto,
        body?: Record<string, undefined>,
        asBatch = false,
    ): AProcessDto {
        if (asBatch) {
            const clone = new BatchProcessDto();
            clone.setHeaders(dto.getHeaders());
            clone.setBridgeData(body ? JSON.stringify(body) : dto.getData());

            return clone;
        }

        const clone = new ProcessDto();
        clone.setHeaders(dto.getHeaders());
        if (body) {
            clone.setJsonData(body);
        } else {
            clone.setData(dto.getData());
        }

        return clone;
    }

}
