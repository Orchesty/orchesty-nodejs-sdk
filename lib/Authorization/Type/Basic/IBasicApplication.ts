import { IApplication } from '../../../Application/Base/IApplication';
import AuthorizationTypeEnum from '../../AuthorizationTypeEnum';

export interface IBasicApplication extends IApplication {
    getAuthorizationType(): AuthorizationTypeEnum;
}
