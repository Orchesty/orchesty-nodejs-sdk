import AProcessDto from './AProcessDto';
import { CORRELATION_ID, NODE_ID } from './Headers';

export default class ProcessDto<Data = unknown> extends AProcessDto<Data> {

    public static createForFormRequest(appName: string, user: string, correlationId: string, nodeId = 'form'): ProcessDto {
        const p = new ProcessDto();
        p.setHeaders({
            [CORRELATION_ID]: correlationId,
            [NODE_ID]: nodeId,
        });
        p.setUser(user);
        p.setCurrentApp(appName);

        return p;
    }

    public setData(data: string): this {
        this.data = data;

        return this;
    }

    public setJsonData(body: unknown): this {
        this.data = JSON.stringify(body);

        return this;
    }

    public setNewJsonData<T>(body: T): ProcessDto<T> {
        this.data = JSON.stringify(body);

        return this as unknown as ProcessDto<T>;
    }

}
