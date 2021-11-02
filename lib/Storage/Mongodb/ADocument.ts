import { id, objectId } from 'mongodb-typescript';
import { ObjectId } from 'mongodb';

export interface IDocument {
  getCollection(): string;
  toArray(): {[key: string]: unknown};
}

export default abstract class ADocument implements IDocument {
  @id @objectId
  protected _id?: ObjectId;

  public getId(): string {
    return this._id?.toHexString() ?? '';
  }

  public getObjectId(): ObjectId {
    if (!this._id) {
      throw Error('_id is not set.');
    }
    return this._id;
  }

  public getCollection = (): string => ADocument.getCollection();

  public static getCollection(): string {
    return this.name;
  }

  public toArray = (): { [key: string]: unknown } => ({});
}
