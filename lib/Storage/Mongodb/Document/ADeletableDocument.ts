import ADocument from '../ADocument';

export default class ADeletableDocument extends ADocument {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected deleted = false;

  public isDeleted(): boolean {
    return this.deleted;
  }

  public setDeleted(): ADeletableDocument {
    this.deleted = true;
    return this;
  }
}
