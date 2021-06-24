import DIContainer from '../lib/DIContainer/Container';
import TestConnector from './Connector/TestConnector';
import TestBasicApplication from './Application/TestBasicApplication';
import CoreServices from '../lib/DIContainer/CoreServices';
import TestOAuth2Application from './Application/TestOAuth2Application';
import {container as c, expressApp as e, initiateContainer, listen as l} from "../lib";
import TestBatch from "./Batch/TestBatch";

initiateContainer();

export const expressApp = e;
export const container = c;

export function listen(): void {
  l();
}

export function getTestContainer(): DIContainer {

  const testConnector = new TestConnector(container.get(CoreServices.CURL));
  const appBasic = new TestBasicApplication();
  const appOAuth = new TestOAuth2Application(container.get(CoreServices.OAUTH2_PROVIDER));
  const batch = new TestBatch();

  // Add them to the DIContainer
  container.setConnector(testConnector);
  container.setApplication(appBasic);
  container.setApplication(appOAuth);
  container.setBatch(batch);

  return container;
}
