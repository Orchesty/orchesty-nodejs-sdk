import CommonLoader from '../Commons/CommonLoader';
import { IApplication } from './Base/IApplication';
import { IApplicationArray } from './Base/AApplication';
import { APPLICATION_PREFIX } from './ApplicationRouter';

export default class ApplicationLoader extends CommonLoader {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getList = (prefix: string): string[] => {
    throw new Error('Unsupported action!');
  };

  public getListApplications(): IApplicationArray[] {
    const list: IApplicationArray[] = [];
    this._container.getAllByPrefix(APPLICATION_PREFIX)
      .forEach((obj: IApplication) => {
        list.push(obj.toArray());
      });

    return list;
  }
}
