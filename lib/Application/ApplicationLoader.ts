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
    let list: IApplicationArray[] = [];
    this._container.getAllByPrefix(APPLICATION_PREFIX)
      .forEach((obj: IApplication) => {
        list.push(obj.toArray());
      });
    list = list.sort(this._compare);
    return list;
  }

  private _compare = (a: IApplicationArray, b: IApplicationArray): number => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    }
    return 0;
  };
}
