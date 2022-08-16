import Field from '../Field';
import FieldType from '../FieldType';

describe('Field tests', () => {
    const type = FieldType.TEXT;
    const key = 'testKey';
    const label = 'testLabel';
    const field = new Field(type, key, label);

    it('setValue', () => {
        expect(field.value).toEqual(null);
        field.setValue(true);
        expect(field.value).toEqual(true);
    });

    it('getType', () => {
        expect(field.type).toEqual(type);
    });

    it('getKey', () => {
        expect(field.key).toEqual(key);
    });
    it('getLabel', () => {
        expect(field.label).toEqual(label);
    });
    it('setLabel', () => {
        expect(field.label).toEqual(label);
        const changedLabel = 'changedLabel';
        field.setLabel(changedLabel);
        expect(field.label).toEqual(changedLabel);
    });
    it('setRequired', () => {
        expect(field.isRequired).toEqual(false);
        field.setRequired(true);
        expect(field.isRequired).toEqual(true);
    });

    it('getDescription and setDescription', () => {
        expect(field.description).toEqual('');
        const description = 'testDescription';
        field.setDescription(description);
        expect(field.description).toEqual(description);
    });
    it('isReadOnly and setReadOnly', () => {
        expect(field.isReadOnly).toEqual(false);
        field.setReadOnly(true);
        expect(field.isReadOnly).toEqual(true);
    });
    it('isDisabled and setDisabled', () => {
        expect(field.isDisabled).toEqual(false);
        field.setDisabled(true);
        expect(field.isDisabled).toEqual(true);
    });
    it('getChoices and setChoices', () => {
        expect(field.choices).toEqual([]);
        const choices = ['yes', 'no'];
        field.setChoices(choices);
        expect(field.choices).toEqual(choices);
    });
    it('toArray', () => {
        const array = {
            type: field.type,
            key: field.key,
            value: field.value,
            label: field.label,
            description: field.description,
            required: field.isRequired,
            readOnly: field.isReadOnly,
            disabled: field.isDisabled,
            choices: field.choices,
        };
        expect(field.toArray).toEqual(array);
    });
});
