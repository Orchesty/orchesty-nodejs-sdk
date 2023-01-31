import CustomActionType from './CustomActionType';

export default class CustomAction {

    public constructor(
        private readonly name: string,
        private readonly url: string,
        private readonly action: CustomActionType,
        private body?: string,
    ) {
    }

    public getName(): string {
        return this.name;
    }

    public getUrl(): string {
        return this.url;
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

    public toArray(): ICustomAction {
        return {
            name: this.name,
            url: this.url,
            action: this.action,
            body: this.body,
        };
    }

}

export interface ICustomAction {
    name: string;
    url: string;
    action: CustomActionType;
    body?: string;
}
