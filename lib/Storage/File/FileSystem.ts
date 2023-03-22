import { existsSync } from 'fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import logger from '../../Logger/Logger';
import DataStorageDocument, { IDataStorageDocument } from '../DataStore/Document/DataStorageDocument';

export default class FileSystem {

    private lockedFiles: string[] = [];

    public constructor(private readonly millisecondsDelayOnFail: number = 2000, private readonly maxTries = 5) {
    }

    public async write<T>(file: string, data: DataStorageDocument<T>[], actualTry = 1): Promise<boolean> {
        if (actualTry > this.maxTries) {
            throw Error(`Max tries haw been reached. Cannot write to file [${file}]`);
        }

        if (this.lockedFiles.includes(file)) {
            await this.sleep();
            return this.write<T>(file, data, actualTry + 1);
        }

        this.lock(file);

        let error;
        try {
            const tmpPath = this.getDirectoryPath(file, true);
            if (!existsSync(tmpPath)) {
                await mkdir(tmpPath, { recursive: true });
            }

            const dataPath = this.getDirectoryPath(file);
            if (!existsSync(dataPath)) {
                await mkdir(dataPath, { recursive: true });
            }
            const tmpFile = this.getFilePath(file, true);
            await writeFile(tmpFile, JSON.stringify(data), 'utf-8');
            await rename(tmpFile, this.getFilePath(file));
        } catch (e) {
            if (e instanceof Error) {
                error = e;
                logger.error(`Write to file [${file}] was not successful. Tries [${actualTry}/${this.maxTries}]`, {}, false, error);
            }
            throw e;
        } finally {
            this.unlock(file);
        }

        return !error;
    }

    public async read<T>(file: string, actualTry = 1): Promise<DataStorageDocument<T>[]> {
        try {
            const dataPath = this.getFilePath(file);
            if (!existsSync(dataPath)) {
                return [];
            }

            if (actualTry > this.maxTries) {
                throw Error(`Max tries haw been reached. Cannot read file [${file}]`);
            }

            if (this.lockedFiles.includes(file)) {
                await this.sleep();
                return await this.read<T>(file, actualTry + 1);
            }

            const data = JSON.parse(await readFile(dataPath, 'utf-8')) as IDataStorageDocument<T>[];
            return data.map<DataStorageDocument<T>>((item) => DataStorageDocument.fromJson(item));
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Read file [${file}] was not successful. Tries [${actualTry}/${this.maxTries}]`, {}, false, error);
                await this.sleep();
                return this.read<T>(file, actualTry + 1);
            }
            throw error;
        }
    }

    public async delete(file: string, actualTry = 1): Promise<boolean> {
        try {
            const dataPath = this.getFilePath(file);
            if (!existsSync(dataPath)) {
                return true;
            }

            if (actualTry > this.maxTries) {
                throw Error(`Max tries haw been reached. Cannot delete file [${file}]`);
            }
            await unlink(dataPath);
            return true;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Delete file [${file}] was not successful. Tries [${actualTry}/${this.maxTries}]`, {}, false, error);
                await this.sleep();
                return this.delete(file, actualTry + 1);
            }
            throw error;
        }
    }

    public getDirectoryPath(file: string, tmp = false): string {
        return `/tmp/orchesty/${tmp ? 'tmp' : 'data'}`;
    }

    public getFilePath(file: string, tmp = false): string {
        return `${this.getDirectoryPath(file, tmp)}/${file}.json`;
    }

    private lock(file: string): void {
        if (!this.lockedFiles.includes(file)) {
            this.lockedFiles.push(file);
        }
    }

    private unlock(file: string): void {
        this.lockedFiles = this.lockedFiles.filter((item) => item !== file);
    }

    private async sleep(): Promise<unknown> {
        return new Promise((resolve) => {
            setTimeout(() => resolve('resolved'), this.millisecondsDelayOnFail);
        });
    }

}
