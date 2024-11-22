import { MongoDb } from '../MongoDb';
import { AbstractRepository } from '../Repository';

interface IDoc {
    id: string;
    data: string;
}

class DocRepository extends AbstractRepository<IDoc> {
}

describe('Repository', () => {
    let repo: DocRepository;
    let client: MongoDb;

    beforeAll(async () => {
        client = new MongoDb(process.env.MONGODB_DSN ?? '');
        await client.connect();
        repo = new DocRepository(client, 'doc');
    });

    afterAll(async () => {
        await client.disconnect();
    });

    it('CRUD', async () => {
        const instance: IDoc = { data: 'datas', id: '' };
        await repo.insert(instance);
        const fetched = await repo.findOne({ id: instance.id });

        expect(fetched)
            .toEqual(instance);

        const fetchedMany = await repo.findMany({ data: 'datas' });

        expect(fetchedMany[0])
            .toEqual(instance);

        await repo.deleteAll();
        const remaining = await repo.findMany({});

        expect(remaining)
            .toHaveLength(0);
    });
});
