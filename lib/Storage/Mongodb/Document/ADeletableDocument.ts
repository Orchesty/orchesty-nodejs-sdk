import ADocument from '../ADocument';

export default class ADeletableDocument extends ADocument {

    protected deleted = false;

    public isDeleted(): boolean {
        return this.deleted;
    }

    public setDeleted(deleted = true): this {
        this.deleted = deleted;
        return this;
    }

}
