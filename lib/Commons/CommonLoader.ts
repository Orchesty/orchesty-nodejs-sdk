import DIContainer from '../DIContainer/Container';
import { IName } from './IName';

export default class CommonLoader {
  constructor(protected _container: DIContainer) {
  }

  public get(prefix: string, name: string): IName {
    return this._container.get(`${prefix}.${name}`);
  }

  public getList(prefix: string): string[] {
    let list: string[] = [];
    this._container.getAllByPrefix(prefix).forEach((obj: IName) => {
      list.push(obj.getName());
    });

    list = list.sort();
    return list;
  }
}
