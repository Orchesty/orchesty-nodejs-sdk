export interface ClassType<T> {
    new(...args: never[]): T;

    getCollection(): string;
}

export default abstract class ADocument {

    protected _id = '';

    public static getCollection(): string {
        return this.name;
    }

    public getId(): string {
        return this._id;
    }

    public getCollection(): string {
        return ADocument.getCollection();
    }

    public toArray(): Record<string, unknown> {
        return {};
    }

    public fromObject<T>(entity: T, object: unknown): T {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.assign(entity as any, object);
        return entity;
    }

}
