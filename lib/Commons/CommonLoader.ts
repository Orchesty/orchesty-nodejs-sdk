import DIContainer from '../DIContainer/Container';
import { IName } from './IName';

export default class CommonLoader {

    public constructor(protected container: DIContainer) {
    }

    public get(prefix: string, name: string): IName {
        return this.container.get(`${prefix}.${name}`);
    }

    public getList(prefix: string): string[] {
        let list: string[] = [];
        this.container.getAllByPrefix(prefix).forEach((obj) => {
            list.push(obj.key);
        });

        list = list.sort();
        return list;
    }

}
