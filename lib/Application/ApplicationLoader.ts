import CommonLoader, { ICommonObject } from '../Commons/CommonLoader';
import { APPLICATION_PREFIX } from './ApplicationRouter';
import { IApplicationArray } from './Base/AApplication';
import { IApplication } from './Base/IApplication';

export default class ApplicationLoader extends CommonLoader {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getList(prefix: string): ICommonObject[] {
        throw new Error('Unsupported action!');
    }

    public getListApplications(): IApplicationArray[] {
        const list: IApplicationArray[] = [];
        this.container.getAllByPrefix(APPLICATION_PREFIX)
            .forEach((obj: IApplication) => {
                list.push(obj.toArray());
            });
        return list.sort(this.compare.bind(this));
    }

}
