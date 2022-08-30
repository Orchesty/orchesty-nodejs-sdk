import { ObjectId } from 'mongodb';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { id, objectId } from 'mongodb-typescript';

export interface IDocument {
    getCollection(): string;

    toArray(): Record<string, unknown>;
}

export default abstract class ADocument implements IDocument {

    @id @objectId
    protected _id?: ObjectId;

    public static getCollection(): string {
        return this.name;
    }

    public getId(): string {
        return this._id?.toHexString() ?? '';
    }

    public getObjectId(): ObjectId {
        if (!this._id) {
            throw Error('_id is not set.');
        }
        return this._id;
    }

    public getCollection(): string {
        return ADocument.getCollection();
    }

    public toArray(): Record<string, unknown> {
        return {};
    }

}
