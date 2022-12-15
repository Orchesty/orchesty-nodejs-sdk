import { createLoggerMockedServer, createMetricsMockedServer} from "../test/MockServer";

beforeAll(async () => {
    createLoggerMockedServer();
    createMetricsMockedServer();
})

afterAll(async () => {
})
