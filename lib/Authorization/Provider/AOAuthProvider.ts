import logger from '../../Logger/Logger';
import Application from '../../Utils/Application';
import { IOAuthProvider } from './IOAuthProvider';

export default abstract class AOAuthProvider implements IOAuthProvider {

    public constructor(private readonly backend: string) {
    }

    public static throwException(message: string, code: number): void {
        logger.error(message, {});
        throw new Error(`Message [${message}] code [${code}]`);
    }

    public getRedirectUri(): string {
        const backendUrl = this.backend.replace(/\/+$/g, '');
        const generatedUrl = Application.generateUrl().replace(/^\/+/g, '');

        return `${backendUrl}/${generatedUrl}`;
    }

}
