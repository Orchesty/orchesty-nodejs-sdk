import ADocument from '../ADocument';

export default class ADeletableDocument extends ADocument {

    protected deleted = false;

    public isDeleted(): boolean {
        return this.deleted;
    }

    public setDeleted(): this {
        this.deleted = true;
        return this;
    }

}
