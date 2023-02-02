import CustomActionType from './CustomActionType';

interface RequestInfo {
    url?: string;
    topologyName?: string;
    nodeName?: string;
    body?: string;
}

export default class CustomAction {

    private url?: string = undefined;

    private body?: string = undefined;

    private topologyName?: string = undefined;

    private nodeName?: string = undefined;

    public constructor(
        private readonly name: string,
        private readonly action: CustomActionType,
        requestInfo: RequestInfo,
    ) {
        if (!(requestInfo.url || requestInfo.topologyName && requestInfo.nodeName)) {
            throw new Error('One or more parameters are missing: url or topologyName and nodeName');
        }

        this.url = requestInfo.url;
        this.topologyName = requestInfo.topologyName;
        this.nodeName = requestInfo.nodeName;
        this.body = requestInfo.body;
    }

    public getName(): string {
        return this.name;
    }

    public getUrl(): string | undefined {
        return this.url;
    }

    public setUrl(value: string): this {
        this.url = value;

        return this;
    }

    public getAction(): CustomActionType {
        return this.action;
    }

    public getBody(): string | undefined {
        return this.body;
    }

    public setBody(value: string): this {
        this.body = value;

        return this;
    }

    public getTopologyName(): string | undefined {
        return this.topologyName;
    }

    public setTopologyName(value: string): this {
        this.topologyName = value;

        return this;
    }

    public getNodeName(): string | undefined {
        return this.nodeName;
    }

    public setNodeName(value: string): this {
        this.nodeName = value;

        return this;
    }

    public toArray(): ICustomAction {
        return {
            name: this.name,
            url: this.url,
            action: this.action,
            body: this.body,
            topologyName: this.topologyName,
            nodeName: this.nodeName,
        };
    }

}

export interface ICustomAction {
    name: string;
    action: CustomActionType;
    url?: string;
    body?: string;
    topologyName?: string;
    nodeName?: string;
}
