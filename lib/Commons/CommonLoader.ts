import AConfirm from '../Confirm/AConfirm';
import DIContainer from '../DIContainer/Container';
import logger from '../Logger/Logger';
import AQuestion from '../Question/AQuestion';
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

            try {
                list.push(this.describe(obj.key, app, obj.value));
            } catch (e) {
                logger.error(`Node "${obj.key}" left out of the "${prefix}" list: ${(e as Error).message}`, {});
            }
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

    private describe(name: string, app: string | undefined, node: unknown): ICommonObject {
        const item: ICommonObject = { name, app };
        if (node instanceof AQuestion) {
            item.schema = node.getSchema();
        } else if (node instanceof AConfirm) {
            item.question = node.getQuestion();
            item.displayFields = node.getDisplayFields();
        }

        return item;
    }

}

export interface ICommonObject {
    name: string;
    app?: string;
    question?: string;
    displayFields?: string[];
    schema?: Record<string, unknown>;

}
