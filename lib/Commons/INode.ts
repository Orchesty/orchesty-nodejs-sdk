import AProcessDto from '../Utils/AProcessDto';
import { IName } from './IName';

export interface INode extends IName {
    processAction(dto: AProcessDto): AProcessDto | Promise<AProcessDto>;
}
