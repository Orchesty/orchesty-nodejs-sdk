import { IOAuthProvider } from './IOAuthProvider';
import logger from '../../Logger/Logger';
import Application from '../../Utils/Application';

export default abstract class AOAuthProvider implements IOAuthProvider {
  constructor(private _backend: string) {
  }

  public getRedirectUri(): string {
    const backendUrl = this._backend.replace(/\/+$/g, '');
    const generatedUrl = Application.generateUrl().replace(/^\/+/g, '');

    return `${backendUrl}/${generatedUrl}`;
  }

  public static throwException(message: string, code: number): void {
    logger.error(message, {});
    throw new Error(`Message [${message}] code [${code}]`);
  }
}
