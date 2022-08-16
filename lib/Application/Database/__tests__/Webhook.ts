import Webhook from '../Webhook';

let webhook: Webhook;

describe('Test for webhooks', () => {
    beforeEach(() => {
        webhook = new Webhook();
    });

    it('getName', () => {
        expect(webhook.getName()).toEqual('');
    });

    it('setName', () => {
        expect(webhook.setName('testName')).toEqual(webhook);
        expect(webhook.getName()).toEqual('testName');
    });

    it('getUser', () => {
        expect(webhook.getUser()).toEqual('');
    });

    it('setUser', () => {
        expect(webhook.setUser('testUser')).toEqual(webhook);
        expect(webhook.getUser()).toEqual('testUser');
    });

    it('getToken', () => {
        expect(webhook.getToken()).toEqual('');
    });

    it('setToken', () => {
        expect(webhook.setToken('testToken')).toEqual(webhook);
        expect(webhook.getToken()).toEqual('testToken');
    });

    it('getNode', () => {
        expect(webhook.getNode()).toEqual('');
    });

    it('setNode', () => {
        expect(webhook.setNode('testNode')).toEqual(webhook);
        expect(webhook.getNode()).toEqual('testNode');
    });

    it('getTopology', () => {
        expect(webhook.getTopology()).toEqual('');
    });

    it('setTopology', () => {
        expect(webhook.setTopology('testTopology')).toEqual(webhook);
        expect(webhook.getTopology()).toEqual('testTopology');
    });

    it('getApplication', () => {
        expect(webhook.getApplication()).toEqual('');
    });

    it('setApplication', () => {
        expect(webhook.setApplication('testApplication')).toEqual(webhook);
        expect(webhook.getApplication()).toEqual('testApplication');
    });

    it('getWebhookId', () => {
        expect(webhook.getWebhookId()).toEqual('');
    });

    it('setWebhookId', () => {
        expect(webhook.setWebhookId('testWebhookId')).toEqual(webhook);
        expect(webhook.getWebhookId()).toEqual('testWebhookId');
    });

    it('getUnsubscribeFailed', () => {
        expect(webhook.getUnsubscribeFailed()).toBeFalsy();
    });

    it('setUnsubscribeFailed', () => {
        expect(webhook.setUnsubscribeFailed(true)).toEqual(webhook);
        expect(webhook.getUnsubscribeFailed()).toBeTruthy();
    });
});
