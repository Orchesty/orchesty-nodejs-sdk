import FileSystem from '../File/FileSystem';
import DataStorageDocument from './Document/DataStorageDocument';

export default class DataStorageManager {

    public constructor(private readonly fileSystem: FileSystem) {
    }

    public async load<T>(
        id: string,
        application?: string,
        user?: string,
        skip?: number,
        limit?: number,
    ): Promise<DataStorageDocument<T>[]> {
        const findData = await this.fileSystem.read<T>(id);

        const end = (skip ?? 0) + (limit ?? 0);
        const filtered = this.filterData<T>(findData, true, application, user);
        return filtered.slice(skip ?? 0, end || filtered.length);
    }

    public async store<T>(id: string, data: T[], application?: string, user?: string): Promise<void> {
        const entities = data.map((item) => new DataStorageDocument<T>()
            .setUser(user)
            .setApplication(application)
            .setData(item));
        const dbData = await this.fileSystem.read<T>(id);
        dbData.push(...entities);
        await this.fileSystem.write<T>(id, dbData);
    }

    public async remove(id: string, application?: string, user?: string): Promise<void> {
        if (!application && !user) {
            await this.fileSystem.delete(id);
        } else {
            let data = await this.fileSystem.read(id);

            data = this.filterData(data, false, application, user);
            await this.fileSystem.write(id, data);
        }
    }

    private filterData<T>(
        data: DataStorageDocument<T>[],
        contains?: boolean,
        application?: string,
        user?: string,
    ): DataStorageDocument<T>[] {
        if (application) {
            data = data.filter((item) => item.getApplication() === application === contains);
        }
        if (user) {
            data = data.filter((item) => item.getUser() === user === contains);
        }

        return data;
    }

}
