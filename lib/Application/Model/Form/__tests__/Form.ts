import Field from '../Field';
import FieldType from '../FieldType';
import Form from '../Form';

describe('Test form', () => {
    it('getFields', () => {
        const form = new Form('testKey', 'testPublicName');
        expect(form.getFields()).toEqual([]);
    });

    it('addField', () => {
        const form = new Form('testKey', 'testPublicName');
        const field = new Field(FieldType.TEXT, 'testKey', 'testLabel');
        form.addField(field);
        expect(form.getFields()).toEqual([field]);
    });

    it('toArray', () => {
        const form = new Form('testKey', 'testPublicName');
        const field = new Field(FieldType.TEXT, 'testKey', 'testLabel');
        form.addField(field);
        form.setDescription('testDescription');
        const fieldsArray = form.toArray();
        const params = [
            'type', 'key', 'value', 'label', 'description', 'required', 'readOnly', 'disabled', 'choices',
        ];

        expect(fieldsArray.key).toEqual('testKey');
        expect(fieldsArray.publicName).toEqual('testPublicName');
        expect(fieldsArray.description).toEqual('testDescription');

        params.forEach((element) => {
            expect(Object.hasOwn(fieldsArray.fields[0], element)).toBeTruthy();
        });
    });
});
