import Field, { IField } from './Field';

export default class Form {

    private description = '';

    private readonly fields: Field[] = [];

    public constructor(private readonly key: string, private publicName: string) {
    }

    public getFields(): Field[] {
        return this.fields;
    }

    public setDescription(value: string): this {
        this.description = value;

        return this;
    }

    public getDescription(): string {
        return this.description;
    }

    public getKey(): string {
        return this.key;
    }

    public setPublicName(value: string): this {
        this.publicName = value;

        return this;
    }

    public getPublicName(): string {
        return this.publicName;
    }

    public addField(field: Field): this {
        this.fields.push(field);
        return this;
    }

    public toArray(): IForm {
        const fields: IField[] = [];
        this.fields.forEach((element) => {
            fields.push(element.toArray());
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
