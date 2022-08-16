import Field, { IField } from './Field';

export default class Form {

    private clDescription = '';

    private readonly clFields: Field[] = [];

    public constructor(private readonly clKey: string, private clPublicName: string) {
    }

    public get fields(): Field[] {
        return this.clFields;
    }

    public set description(value: string) {
        this.clDescription = value;
    }

    public get description(): string {
        return this.clDescription;
    }

    public get key(): string {
        return this.clKey;
    }

    public set publicName(value: string) {
        this.clPublicName = value;
    }

    public get publicName(): string {
        return this.clPublicName;
    }

    public addField(field: Field): this {
        this.fields.push(field);
        return this;
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
