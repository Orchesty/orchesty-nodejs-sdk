import { IApplication } from '../Application/Base/IApplication';
import DIContainer from '../DIContainer/Container';
import { IName } from './IName';

export default class CommonLoader {

    public constructor(protected container: DIContainer) {
    }

    public get(prefix: string, name: string): IName {
        return this.container.get(`${prefix}.${name}`);
    }

    public getList(prefix: string): ICommonObject[] {
        const list: ICommonObject[] = [];
        this.container.getAllByPrefix(prefix).forEach((obj: INameAndApplication) => {
            let app: string | undefined;
            try {
                app = obj.getApplication().getName();
            } catch (e) {
                app = undefined;
            }

            list.push({ name: obj.getName(), app });
        });

        return list.sort(this.compare.bind(this));
    }

    protected compare(a: ICommonObject, b: ICommonObject): number {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
        }
        return 0;
    }

}

export interface ICommonObject {
    app?: string;
    name: string;
}

export interface INameAndApplication extends IName {
    getApplication(): IApplication;
}
