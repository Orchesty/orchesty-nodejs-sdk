import Field from '../Field';
import FieldType from '../FieldType';
import Form from '../Form';

describe('Test form', () => {
  it('getFields', () => {
    const form = new Form('testKey', 'testPublicName');
    expect(form.fields).toEqual([]);
  });

  it('addField', () => {
    const form = new Form('testKey', 'testPublicName');
    const field = new Field(FieldType.TEXT, 'testKey', 'testLabel');
    form.addField(field);
    expect(form.fields).toEqual([field]);
  });

  it('toArray', () => {
    const form = new Form('testKey', 'testPublicName');
    const field = new Field(FieldType.TEXT, 'testKey', 'testLabel');
    form.addField(field);
    form.description = 'testDescription';
    const fieldsArray = form.toArray();
    const params = [
      'type', 'key', 'value', 'label', 'description', 'required', 'readOnly', 'disabled', 'choices',
    ];

    expect(fieldsArray.key).toEqual('testKey');
    expect(fieldsArray.publicName).toEqual('testPublicName');
    expect(fieldsArray.description).toEqual('testDescription');

    params.forEach((element) => {
      expect(Object.prototype.hasOwnProperty.call(fieldsArray.fields[0], element)).toBeTruthy();
    });
  });
});
