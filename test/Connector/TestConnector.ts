import { ApplicationInstall } from '../../lib/Application/Database/ApplicationInstall';
import AConnector from '../../lib/Connector/AConnector';
import OnRepeatException from '../../lib/Exception/OnRepeatException';
import RequestDto from '../../lib/Transport/Curl/RequestDto';
import { HttpMethods } from '../../lib/Transport/HttpMethods';
import ProcessDto from '../../lib/Utils/ProcessDto';

export default class TestConnector extends AConnector {

    public getName(): string {
        return 'test';
    }

    public async getApplicationInstallFromHeaders(dto: ProcessDto): Promise<ApplicationInstall> {
        return this.getApplicationInstallFromProcess(dto);
    }

    public async processAction(_dto: ProcessDto): Promise<ProcessDto> {
        const dto = _dto;
        dto.setJsonData({
            test: 'ok',
            processed: Date.now()
                .toString(),
        });

        await Promise.all(
            [1, 2, 3].map(async () => {
                const requestDto = new RequestDto('https://jsonplaceholder.typicode.com/users', HttpMethods.GET, _dto, '', { custom: 'header' });
                requestDto.setDebugInfo(dto);
                const responseDto = await this.getSender().send(requestDto);
                if (responseDto.getResponseCode() !== 200 && responseDto.getResponseCode() !== 201) {
                    throw new OnRepeatException();
                }
                dto.setData(responseDto.getBody());
            }),
        );

        return dto;
    }

}
