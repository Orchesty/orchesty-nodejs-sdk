import ProcessDto from '../Utils/ProcessDto';
import { IName } from './IName';

export interface ICommonNode extends IName {
    processAction(dto: ProcessDto): Promise<ProcessDto>|ProcessDto;
}
