import DIContainer from '../DIContainer/Container';
import { IName } from './IName';

export default class CommonLoader {

    public constructor(protected container: DIContainer) {
    }

    public get(prefix: string, name: string): IName {
        return this.container.getNamed(`${prefix}.${name}`);
    }

    public getList(prefix: string): ICommonObject[] {
        const list: ICommonObject[] = [];
        this.container.getAllByPrefix(prefix).forEach((obj) => {
            let app: string | undefined;
            try {
                app = obj.value.getApplication().getName();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                app = undefined;
            }

            const item: ICommonObject = { name: obj.key, app };
            if (typeof obj.value.getQuestion === 'function') {
                item.question = obj.value.getQuestion();
            }
            if (typeof obj.value.getDisplayFields === 'function') {
                item.displayFields = obj.value.getDisplayFields();
            }
            list.push(item);
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
    question?: string;
    displayFields?: string[];

}
