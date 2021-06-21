/* eslint-disable @typescript-eslint/naming-convention */
import { id, objectId } from 'mongodb-typescript';
import { ObjectId } from 'mongodb';

export interface IDocument {
  getCollection(): string;
  toArray(): {[key: string]: unknown};
}

export default abstract class DocumentAbstract implements IDocument {
  @id @objectId
  protected _id?: ObjectId;

  public getId(): string {
    return this._id?.toHexString() ?? '';
  }

  public getCollection = (): string => DocumentAbstract.getCollection();

  public static getCollection(): string {
    return this.name;
  }

  public toArray = (): { [key: string]: unknown } => ({});
}
