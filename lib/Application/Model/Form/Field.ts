import FieldType from './FieldType';

export interface IFieldArray {
    type: FieldType;
    key: string;
    value: unknown;
    label: string;
    description: string;
    required: boolean;
    readOnly: boolean;
    disabled: boolean;
    choices: unknown[];
}

export default class Field {
  private _description = '';

  private _readOnly = false;

  private _disabled = false;

  private _choices: unknown[] = [];

  public constructor(
        private _type: FieldType,
        private _key: string,
        private _label: string,
        private _value: unknown = null,
        private _required: boolean = false,
  ) {
  }

  public get type(): FieldType {
    return this._type;
  }

  public get key(): string {
    return this._key;
  }

  public get value(): unknown {
    return this._value;
  }

  public get label(): string {
    return this._label;
  }

  public get description(): string {
    return this._description;
  }

  public get choices(): unknown[] {
    return this._choices;
  }

  public get isRequired(): boolean {
    return this._required;
  }

  public get isReadOnly(): boolean {
    return this._readOnly;
  }

  public get isDisabled(): boolean {
    return this._disabled;
  }

  public get toArray(): IFieldArray {
    return {
      type: this.type,
      key: this.key,
      value: this.value,
      label: this.label,
      description: this.description,
      required: this.isRequired,
      readOnly: this.isReadOnly,
      disabled: this.isDisabled,
      choices: this.choices,
    };
  }

  public setLabel(label: string): Field {
    this._label = label;
    return this;
  }

  public setValue(value: unknown): Field {
    this._value = value;
    return this;
  }

  public setDescription(description: string): Field {
    this._description = description;
    return this;
  }

  public setRequired(required: boolean): Field {
    this._required = required;
    return this;
  }

  public setReadOnly(readOnly: boolean): Field {
    this._readOnly = readOnly;
    return this;
  }

  public setDisabled(disabled: boolean): Field {
    this._disabled = disabled;
    return this;
  }

  public setChoices(choices: unknown[]): Field {
    this._choices = choices;
    return this;
  }
}
