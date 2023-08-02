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

    private description = '';

    private readOnly = false;

    private disabled = false;

    private choices: unknown[] = [];

    public constructor(
        private readonly type: FieldType,
        private readonly key: string,
        private label: string,
        private value: unknown = null,
        private required = false,
    ) {
    }

    public getType(): FieldType {
        return this.type;
    }

    public getKey(): string {
        return this.key;
    }

    public getValue(): unknown {
        return this.value;
    }

    public getLabel(): string {
        return this.label;
    }

    public getDescription(): string {
        return this.description;
    }

    public getChoices(): unknown[] {
        return this.choices;
    }

    public isRequired(): boolean {
        return this.required;
    }

    public isReadOnly(): boolean {
        return this.readOnly;
    }

    public isDisabled(): boolean {
        return this.disabled;
    }

    public toArray(): IField {
        return {
            type: this.type,
            key: this.key,
            value: this.value,
            label: this.label,
            description: this.description,
            required: this.required,
            readOnly: this.readOnly,
            disabled: this.disabled,
            choices: this.choices,
        };
    }

    public setLabel(label: string): this {
        this.label = label;
        return this;
    }

    public setValue(value: unknown): this {
        this.value = value;
        return this;
    }

    public setDescription(description: string): this {
        this.description = description;
        return this;
    }

    public setRequired(required: boolean): this {
        this.required = required;
        return this;
    }

    public setReadOnly(readOnly: boolean): this {
        this.readOnly = readOnly;
        return this;
    }

    public setDisabled(disabled: boolean): this {
        this.disabled = disabled;
        return this;
    }

    public setChoices(choices: unknown[]): this {
        this.choices = choices;
        return this;
    }

}
