import CustomAction from '../CustomAction';
import CustomActionType from '../CustomActionType';

describe('Test for CustomAction', () => {
    it('Make new CustomAction with Call action type', () => {
        const name = 'testName';
        const url = 'testUrl';
        const action = CustomActionType.CALL;
        const body = 'body';
        const customAction = new CustomAction(name, url, action, body);

        expect(customAction.getName()).toEqual(name);
        expect(customAction.getUrl()).toEqual(url);
        expect(customAction.getAction()).toEqual(action);
        expect(customAction.getBody()).toEqual(body);
    });

    it('Make new CustomAction with Open action', () => {
        const name = 'testName';
        const url = 'testUrl';
        const action = CustomActionType.OPEN;
        const customAction = new CustomAction(name, url, action);

        expect(customAction.getName()).toEqual(name);
        expect(customAction.getUrl()).toEqual(url);
        expect(customAction.getAction()).toEqual(action);
        expect(customAction.getBody()).toBeUndefined();
    });
});
