import { Application } from 'express';
import { FetchMockStatic } from 'fetch-mock';
import fetchMock from 'fetch-mock-jest';
import mf from 'node-fetch';
import { container as c, expressApp as e, initiateContainer, listen as l } from '../lib';
import CommonLoader from '../lib/Commons/CommonLoader';
import DIContainer from '../lib/DIContainer/Container';
import CoreServices from '../lib/DIContainer/CoreServices';
import Metrics from '../lib/Metrics/Metrics';
import MongoDbClient from '../lib/Storage/Mongodb/Client';
import Redis from '../lib/Storage/Redis/Redis';
import TestBasicApplication from './Application/TestBasicApplication';
import TestOAuth2Application from './Application/TestOAuth2Application';
import TestWebhookApplication from './Application/TestWebhookApplication';
import TestBatch from './Batch/TestBatch';
import TestConnector from './Connector/TestConnector';
import TestCustomNode from './CustomNode/TestCustomNode';
import TestMapperNode from './CustomNode/TestMapperNode';
import TestOnRepeatExceptionNode from './CustomNode/TestOnRepeatExceptionNode';

jest.mock('node-fetch', () => fetchMock.sandbox());

export const expressApp = e;
export const container = c;

export function listen(): void {
    l();
}

export async function getTestContainer(): Promise<DIContainer> {
    await initiateContainer();
    const testConnector = new TestConnector().setSender(container.get(CoreServices.CURL));
    const appBasic = new TestBasicApplication();
    const appOAuth = new TestOAuth2Application(container.get(CoreServices.OAUTH2_PROVIDER));
    const appWebhook = new TestWebhookApplication();
    const batch = new TestBatch();
    const custom = new TestCustomNode();
    const onRepeatExceptionCustom = new TestOnRepeatExceptionNode();

    // Add them to the DIContainer
    container.setConnector(testConnector);
    container.setApplication(appBasic);
    container.setApplication(appOAuth);
    container.setApplication(appWebhook);
    container.setBatch(batch);
    container.setCustomNode(custom);
    container.setCustomNode(onRepeatExceptionCustom);
    container.setCustomNode(new TestMapperNode());

    return container;
}

export function mockRouter(): {
    postFn: jest.Mock;
    getFn: jest.Mock;
    routeFn: jest.Mock;
    express: Application;
    loader: CommonLoader;
} {
    const postFn = jest.fn();
    const getFn = jest.fn();
    const route = {
        post: postFn,
        get: getFn,
    };

    const routeFn = jest.fn().mockReturnValue(route);
    const express = {
        route: routeFn,
        address: jest.fn(),
        listen: jest.fn(),
    } as never as Application;

    const loader = {
        get: jest.fn(),
        getList: jest.fn(),
    } as never as CommonLoader;

    return {
        postFn, getFn, routeFn, express, loader,
    };
}

export async function dropCollection(collection: string): Promise<void> {
    const dm = c.get<MongoDbClient>(CoreServices.MONGO);
    const db = await dm.db();

    try {
        await db.dropCollection(collection);
        if (c.has(CoreServices.REDIS)) {
            const redis = c.get<Redis>(CoreServices.REDIS);
            await redis.dropAll();
        }
    } catch {
        // Ignore
    }
}

export async function closeConnections(): Promise<void> {
    const dm = c.get<MongoDbClient>(CoreServices.MONGO);
    await dm.down();
    await container.get<Metrics>(CoreServices.METRICS).close();
    if (c.has(CoreServices.REDIS)) {
        const redis = c.get<Redis>(CoreServices.REDIS);
        await redis.dropAll();
    }
}

export const mockedFetch: FetchMockStatic = mf as unknown as FetchMockStatic;
