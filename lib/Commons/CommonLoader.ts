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
        this.container.getAllByPrefix(prefix).forEach((obj) => {
            let app: string | undefined;
            try {
                app = obj.value.getApplication().getName();
            } catch (e) {
                app = undefined;
            }

            list.push({ name: obj.key, app });
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
    name: string;
    app?: string;

}
