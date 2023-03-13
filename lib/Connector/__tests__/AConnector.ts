import TestBasicApplication from '../../../test/Application/TestBasicApplication';
import TestConnector from '../../../test/Connector/TestConnector';
import { appInstallConfig, mockOnce } from '../../../test/MockServer';
import { getTestContainer, USER } from '../../../test/TestAbstact';
import { IApplication } from '../../Application/Base/IApplication';
import { orchestyOptions } from '../../Config/Config';
import DIContainer from '../../DIContainer/Container';
import DatabaseClient from '../../Storage/Database/Client';
import CurlSender from '../../Transport/Curl/CurlSender';
import { HttpMethods } from '../../Transport/HttpMethods';
import ProcessDto from '../../Utils/ProcessDto';

describe('Test AConnector', () => {
    let container: DIContainer;
    let mongoDbClient: DatabaseClient;
    let curlSender: CurlSender;
    let testConnector: TestConnector;

    beforeAll(() => {
        container = getTestContainer();
        mongoDbClient = container.get(DatabaseClient);
        curlSender = container.get(CurlSender);
        testConnector = new TestConnector();
    });

    it('should set application of connector', () => {
        const application = new TestBasicApplication();
        testConnector.setApplication(application);
        const testConnectorApplicationName = (Reflect.get(testConnector, 'application') as IApplication).getName();
        expect(application.getName()).toEqual(testConnectorApplicationName);
    });

    it('should set sender of connector', () => {
        testConnector.setSender(curlSender);
        const testConnectorCurlSender = Reflect.get(testConnector, 'sender');
        expect(testConnectorCurlSender).toEqual(curlSender);
    });

    it('should return applicationInstall', async () => {
        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);

        mockOnce([{
            request: {
                method: HttpMethods.GET,
                url: `${orchestyOptions.workerApi}/document/ApplicationInstall?filter={"users":["${USER}"],"enabled":true,"names":["${application.getName()}"]}`,
            },
            response: { body: [appInstallConfig] },
        }]);

        const dto = new ProcessDto();
        dto.setHeaders({ user: USER });
        const res = await testConnector.getApplicationInstallFromHeaders(dto);
        expect(res.getUser()).toEqual(USER);
    });

    it('should throw error', async () => {
        const application = new TestBasicApplication();
        testConnector.setDb(mongoDbClient);
        testConnector.setApplication(application);

        const dto = new ProcessDto();
        dto.setHeaders({});
        try {
            await testConnector.getApplicationInstallFromHeaders(dto);
        } catch (e) {
            expect(e).toEqual(Error('User not defined'));
        }
    });
});
