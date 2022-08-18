import Field from '../Field';
import FieldType from '../FieldType';

describe('Field tests', () => {
    const type = FieldType.TEXT;
    const key = 'testKey';
    const label = 'testLabel';
    const field = new Field(type, key, label);

    it('setValue', () => {
        expect(field.getValue()).toEqual(null);
        field.setValue(true);
        expect(field.getValue()).toEqual(true);
    });

    it('getType', () => {
        expect(field.getType()).toEqual(type);
    });

    it('getKey', () => {
        expect(field.getKey()).toEqual(key);
    });
    it('getLabel', () => {
        expect(field.getLabel()).toEqual(label);
    });
    it('setLabel', () => {
        expect(field.getLabel()).toEqual(label);
        const changedLabel = 'changedLabel';
        field.setLabel(changedLabel);
        expect(field.getLabel()).toEqual(changedLabel);
    });
    it('setRequired', () => {
        expect(field.isRequired()).toEqual(false);
        field.setRequired(true);
        expect(field.isRequired()).toEqual(true);
    });

    it('getDescription and setDescription', () => {
        expect(field.getDescription()).toEqual('');
        const description = 'testDescription';
        field.setDescription(description);
        expect(field.getDescription()).toEqual(description);
    });
    it('isReadOnly and setReadOnly', () => {
        expect(field.isReadOnly()).toEqual(false);
        field.setReadOnly(true);
        expect(field.isReadOnly()).toEqual(true);
    });
    it('isDisabled and setDisabled', () => {
        expect(field.isDisabled()).toEqual(false);
        field.setDisabled(true);
        expect(field.isDisabled()).toEqual(true);
    });
    it('getChoices and setChoices', () => {
        expect(field.getChoices()).toEqual([]);
        const choices = ['yes', 'no'];
        field.setChoices(choices);
        expect(field.getChoices()).toEqual(choices);
    });
    it('toArray', () => {
        const array = {
            type: field.getType(),
            key: field.getKey(),
            value: field.getValue(),
            label: field.getLabel(),
            description: field.getDescription(),
            required: field.isRequired(),
            readOnly: field.isReadOnly(),
            disabled: field.isDisabled(),
            choices: field.getChoices(),
        };
        expect(field.toArray()).toEqual(array);
    });
});
