import ProcessDto from '../../Utils/ProcessDto';
import { ApplicationInstall } from '../Database/ApplicationInstall';

export interface ILimitedApplication {

  injectLimit(dto: ProcessDto, appInstall: ApplicationInstall): ProcessDto;
}
