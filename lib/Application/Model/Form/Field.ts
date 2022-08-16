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

    private clDescription = '';

    private clReadOnly = false;

    private clDisabled = false;

    private clChoices: unknown[] = [];

    public constructor(
        private readonly clType: FieldType,
        private readonly clKey: string,
        private clLabel: string,
        private clValue: unknown = null,
        private clRequired: boolean = false,
    ) {
    }

    public get type(): FieldType {
        return this.clType;
    }

    public get key(): string {
        return this.clKey;
    }

    public get value(): unknown {
        return this.clValue;
    }

    public get label(): string {
        return this.clLabel;
    }

    public get description(): string {
        return this.clDescription;
    }

    public get choices(): unknown[] {
        return this.clChoices;
    }

    public get isRequired(): boolean {
        return this.clRequired;
    }

    public get isReadOnly(): boolean {
        return this.clReadOnly;
    }

    public get isDisabled(): boolean {
        return this.clDisabled;
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
        this.clLabel = label;
        return this;
    }

    public setValue(value: unknown): this {
        this.clValue = value;
        return this;
    }

    public setDescription(description: string): this {
        this.clDescription = description;
        return this;
    }

    public setRequired(required: boolean): this {
        this.clRequired = required;
        return this;
    }

    public setReadOnly(readOnly: boolean): this {
        this.clReadOnly = readOnly;
        return this;
    }

    public setDisabled(disabled: boolean): this {
        this.clDisabled = disabled;
        return this;
    }

    public setChoices(choices: unknown[]): this {
        this.clChoices = choices;
        return this;
    }

}
