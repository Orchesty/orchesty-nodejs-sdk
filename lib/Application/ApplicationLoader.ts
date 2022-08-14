import CommonLoader from '../Commons/CommonLoader';
import { APPLICATION_PREFIX } from './ApplicationRouter';
import { IApplicationArray } from './Base/AApplication';
import { IApplication } from './Base/IApplication';

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

  private readonly _compare = (a: IApplicationArray, b: IApplicationArray): number => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    }
    return 0;
  };
}
