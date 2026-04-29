import WebhookSubscription from '../WebhookSubscription';

describe('Test for WebhookSubscription', () => {
    it('Make new WebhookSubscription', () => {
        const name = 'testName';
        const node = 'testNode';
        const topology = 'testTopology';
        const parameters = {
            param1: 'param1Value',
            param2: 'param2Value',
        };
        const webhookSub = new WebhookSubscription(name, node, topology, parameters);

        expect(webhookSub.getName()).toEqual(name);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        expect(webhookSub.getNode()).toEqual(node);
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        expect(webhookSub.getTopology()).toEqual(topology);
        expect(webhookSub.getParameters()).toEqual(parameters);
    });
});
