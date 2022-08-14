import Field, { IField } from './Field';

export default class Form {
  private _description = '';

  private readonly _fields: Field[] = [];

  public constructor(private readonly _key: string, private _publicName: string) {
  }

  public addField(field: Field): this {
    this.fields.push(field);
    return this;
  }

  public get fields(): Field[] {
    return this._fields;
  }

  public set description(value: string) {
    this._description = value;
  }

  public get description(): string {
    return this._description;
  }

  public get key(): string {
    return this._key;
  }

  public set publicName(value: string) {
    this._publicName = value;
  }

  public get publicName(): string {
    return this._publicName;
  }

  public toArray(): IForm {
    const fields: IField[] = [];
    this.fields.forEach((element) => {
      fields.push(element.toArray);
    });

    return {
      key: this.key,
      publicName: this.publicName,
      description: this.description,
      fields,
    };
  }
}

export interface IForm {
  key: string;
  publicName: string;
  description: string;
  fields: IField[];
}
