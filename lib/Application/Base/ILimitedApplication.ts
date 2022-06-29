import { ApplicationInstall } from '../Database/ApplicationInstall';
import AProcessDto from '../../Utils/AProcessDto';

export interface ILimitedApplication {

  injectLimit(dto: AProcessDto, appInstall: ApplicationInstall): AProcessDto;
}
