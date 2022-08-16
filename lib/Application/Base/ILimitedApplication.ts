import AProcessDto from '../../Utils/AProcessDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';

export interface ILimitedApplication {

    injectLimit(dto: AProcessDto, appInstall: ApplicationInstall): AProcessDto;
}
