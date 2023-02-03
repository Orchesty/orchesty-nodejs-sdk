import CustomAction from '../CustomAction';
import CustomActionType from '../CustomActionType';

describe('Test for CustomAction', () => {
    it('Make new CustomAction with Call action type', () => {
        const name = 'testName';
        const url = 'testUrl';
        const action = CustomActionType.CALL;
        const body = 'body';
        const customAction = new CustomAction(name, action, { url, body });

        expect(customAction.getName()).toEqual(name);
        expect(customAction.getUrl()).toEqual(url);
        expect(customAction.getAction()).toEqual(action);
        expect(customAction.getBody()).toEqual(body);
        expect(customAction.getTopologyName()).toBeFalsy();
        expect(customAction.getNodeName()).toBeFalsy();
    });

    it('Make new CustomAction with Call topology', () => {
        const name = 'testName';
        const topologyName = 'testTopologyName';
        const nodeName = 'testNodeName';
        const action = CustomActionType.CALL;
        const body = 'body';
        const customAction = new CustomAction(name, action, { body, topologyName, nodeName });

        expect(customAction.getName()).toEqual(name);
        expect(customAction.getUrl()).toBeFalsy();
        expect(customAction.getAction()).toEqual(action);
        expect(customAction.getBody()).toEqual(body);
        expect(customAction.getTopologyName()).toEqual(topologyName);
        expect(customAction.getNodeName()).toEqual(nodeName);
    });

    it('Make new CustomAction with Open action', () => {
        const name = 'testName';
        const url = 'testUrl';
        const action = CustomActionType.OPEN;
        const customAction = new CustomAction(name, action, { url });

        expect(customAction.getName()).toEqual(name);
        expect(customAction.getUrl()).toEqual(url);
        expect(customAction.getAction()).toEqual(action);
        expect(customAction.getBody()).toBeFalsy();
        expect(customAction.getTopologyName()).toBeFalsy();
        expect(customAction.getNodeName()).toBeFalsy();
    });
});
