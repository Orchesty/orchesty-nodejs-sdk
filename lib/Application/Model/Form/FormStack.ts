import Form, { IForm } from './Form';

export default class FormStack {
  private _forms: Form[] = [];

  public toArray(): Record<string, IForm> {
    const output: Record<string, IForm> = {};

    this._forms.forEach((form) => { output[form.key] = form.toArray(); });

    return output;
  }

  public getForms(): Form[] {
    return this._forms;
  }

  public addForm(form: Form): FormStack {
    this._forms.push(form);
    return this;
  }
}