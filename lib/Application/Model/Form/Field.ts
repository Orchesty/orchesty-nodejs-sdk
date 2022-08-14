import FieldType from './FieldType';

export interface IField {
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
    private readonly _type: FieldType,
    private readonly _key: string,
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

  public get toArray(): IField {
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

  public setLabel(label: string): this {
    this._label = label;
    return this;
  }

  public setValue(value: unknown): this {
    this._value = value;
    return this;
  }

  public setDescription(description: string): this {
    this._description = description;
    return this;
  }

  public setRequired(required: boolean): this {
    this._required = required;
    return this;
  }

  public setReadOnly(readOnly: boolean): this {
    this._readOnly = readOnly;
    return this;
  }

  public setDisabled(disabled: boolean): this {
    this._disabled = disabled;
    return this;
  }

  public setChoices(choices: unknown[]): this {
    this._choices = choices;
    return this;
  }
}
