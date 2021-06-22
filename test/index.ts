import TestConnector from './Connector/TestConnector';
import { container, initiateContainer, listen } from '../lib';

initiateContainer();

const curlSender = container.get('hbpf.core.curl_sender');
const testConnector = new TestConnector(curlSender);
container.setConnector(testConnector.getName(), testConnector);

listen();
