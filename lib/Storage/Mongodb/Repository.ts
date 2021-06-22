import { Repository as BaseRepo } from 'mongodb-typescript';
import {
  FilterQuery, MongoClient, ObjectId, ReplaceOneOptions,
} from 'mongodb';
import { ClassType, RepositoryOptions } from 'mongodb-typescript/lib/repository';
import CryptManager from '../../Crypt/CryptManager';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';

export default class Repository<T> extends BaseRepo<T> {
  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Type: ClassType<T>,
    mongo: MongoClient,
    collection: string,
    private _crypt: CryptManager,
    options?: RepositoryOptions,
  ) {
    super(Type, mongo, collection, options);
  }

  public async insert(entity: T): Promise<void> {
    this._encrypt(entity);
    return super.insert(entity);
  }

  public async update(entity: T, options?: ReplaceOneOptions): Promise<void> {
    this._encrypt(entity);
    return super.update(entity, options);
  }

  public async save(entity: T): Promise<void> {
    this._encrypt(entity);
    return super.save(entity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/naming-convention
  public async findOne(query?: FilterQuery<T | { _id: any; }>): Promise<T | null> {
    const entity = await super.findOne(query);
    if (entity) {
      this._decrypt(entity);
    }
    return entity;
  }

  public async findById(id: ObjectId): Promise<T | null> {
    const entity = await super.findById(id);
    if (entity) {
      this._decrypt(entity);
    }
    return entity;
  }

  public async findManyById(ids: ObjectId[]): Promise<T[]> {
    const entities = await super.findManyById(ids);
    if (entities) {
      entities.forEach((entity) => {
        this._decrypt(entity);
      });
    }
    return entities;
  }

  private _encrypt(entity: T) {
    if (Object.prototype.hasOwnProperty.call(entity, 'settings')
      && Object.prototype.hasOwnProperty.call(entity, 'encryptedSettings')
    ) {
      const encrypted = this._crypt.encrypt((entity as unknown as ApplicationInstall).getSettings());
      ((entity as unknown as ApplicationInstall)).setEncryptedSettings(encrypted);
      ((entity as unknown as ApplicationInstall)).setUpdated();
    }
  }

  private _decrypt(entity: T) {
    if (Object.prototype.hasOwnProperty.call(entity, 'settings')
      && Object.prototype.hasOwnProperty.call(entity, 'encryptedSettings')
    ) {
      const decrypted = this._crypt.decrypt((entity as unknown as ApplicationInstall).getEncryptedSettings());
      ((entity as unknown as ApplicationInstall)).setSettings(decrypted);
      ((entity as unknown as ApplicationInstall)).setEncryptedSettings('');
    }
  }
}
