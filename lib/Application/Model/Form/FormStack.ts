import Form, { IForm } from './Form';

export default class FormStack {

    private readonly forms: Form[] = [];

    public toArray(): Record<string, IForm> {
        const output: Record<string, IForm> = {};

        this.forms.forEach((form) => {
            output[form.getKey()] = form.toArray();
        });

        return output;
    }

    public getForms(): Form[] {
        return this.forms;
    }

    public addForm(form: Form): this {
        this.forms.push(form);
        return this;
    }

}
