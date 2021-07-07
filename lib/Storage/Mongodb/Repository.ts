import { Repository as BaseRepo } from 'mongodb-typescript';
import {
  Cursor, FilterQuery, MongoClient, ObjectId, ReplaceOneOptions,
} from 'mongodb';
import { ClassType, RepositoryOptions } from 'mongodb-typescript/lib/repository';
import CryptManager from '../../Crypt/CryptManager';
import { ApplicationInstall } from '../../Application/Database/ApplicationInstall';
import { IQueryFilter } from './Filters/AQueryFilter';
import filters from './Filters';

export default class Repository<T> extends BaseRepo<T> {
  private readonly _filters: { [key: string]: IQueryFilter };

  constructor(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Type: ClassType<T>,
    mongo: MongoClient,
    collection: string,
    private _crypt: CryptManager,
    options?: RepositoryOptions,
  ) {
    super(Type, mongo, collection, options);
    this._filters = filters;
  }

  public async insert(entity: T): Promise<void> {
    this._encrypt(entity);
    return super.insert(entity);
  }

  public async update(entity: T, options?: ReplaceOneOptions): Promise<void> {
    this._encrypt(entity);
    return super.update(entity, options);
  }

  public async upsert(entity: T): Promise<void> {
    this._encrypt(entity);
    return super.save(entity);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
  public async findMany(query?: FilterQuery<T | { _id: any; }>): Promise<T[]> {
    this._decorateQuery(query);
    const entities = await super.find(query)
      .toArray();
    entities.forEach((entity) => {
      this._decrypt(entity);
    });
    return entities;
  }

  /* eslint-disable */
  public find = (query?: FilterQuery<T | { _id: any; }>): Cursor<T> => {
    throw new Error('Use findMany method!');
  };
  /* eslint-enable */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
  public async findOne(query?: FilterQuery<T | { _id: any; }>): Promise<T | null> {
    this._decorateQuery(query);
    const entity = await super.findOne(query);
    if (entity) {
      this._decrypt(entity);
    }
    return entity;
  }

  public async findById(id: ObjectId): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const query = { _id: id };
    this._decorateQuery(query);
    const entity = await super.findOne(query);
    if (entity) {
      this._decrypt(entity);
    }
    return entity;
  }

  public async findManyById(ids: ObjectId[]): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const query = { _id: { $in: ids } };
    this._decorateQuery(query);
    const entities = await super.find(query)
      .toArray();
    if (entities) {
      entities.forEach((entity) => {
        this._decrypt(entity);
      });
    }
    return entities;
  }

  public async remove(entity: T): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Object.prototype.hasOwnProperty.call(entity as any, 'deleted')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.update((entity as any).setDeleted());
    } else {
      await super.remove(entity);
    }
  }

  public enableFilter(name: string): void | Error {
    if (!Object.prototype.hasOwnProperty.call(this._filters, name)) {
      throw new Error('This filter doesn´t exist');
    }
    this._filters[name].active(true);
  }

  public disableFilter(name: string): void | Error {
    if (!Object.prototype.hasOwnProperty.call(this._filters, name)) {
      throw new Error('This filter doesn´t exist');
    }
    this._filters[name].active(false);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
  private _decorateQuery(query?: FilterQuery<T | { _id: any; }>): void {
    Object.entries(this._filters)
      .forEach((item) => {
        item[1].decorate(this.Type, query);
      });
  }
}
