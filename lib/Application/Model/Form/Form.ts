import Field, { IFieldArray } from './Field';

export default class Form {
  private _fields: Field[] = [];

  public addField(field: Field): Form {
    this.fields.push(field);
    return this;
  }

  public get fields(): Field[] {
    return this._fields;
  }

  public toArray(): IFieldArray[] {
    const fieldsArray: IFieldArray[] = [];
    this.fields.forEach((element) => {
      fieldsArray.push(element.toArray);
    });

    return fieldsArray;
  }
}
