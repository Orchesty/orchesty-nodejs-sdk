// eslint-disable-next-line max-classes-per-file
import { ObjectId } from 'mongodb';
import { MongoDb } from '../MongoDb';
import { Repository } from '../Repository';

class Doc {

    public _id: ObjectId = new ObjectId();

    public constructor(public data: string) {
    }

}

class DocRepository extends Repository<Doc> {
}

describe('Repository', () => {
    let repo: DocRepository;
    let client: MongoDb;

    beforeAll(async () => {
        client = new MongoDb(process.env.MONGODB_DSN ?? '');
        await client.connect();
        repo = new DocRepository(client, Doc.name);
    });

    afterAll(async () => {
        await client.disconnect();
    });

    it('CRUD', async () => {
        const instance = new Doc('datas');
        await repo.insert(instance);
        const fetched = await repo.findOne({ _id: instance._id });
        expect(fetched).toEqual(instance);

        const fetchedMany = await repo.find({ data: 'datas' });
        expect(fetchedMany[0]).toEqual(instance);

        await repo.deleteAll();
        const remaining = await repo.find({});
        expect(remaining).toHaveLength(0);
    });
});
