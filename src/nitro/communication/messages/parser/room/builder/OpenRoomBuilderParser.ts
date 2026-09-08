import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class OpenRoomBuilderParser implements IMessageParser
{
    public flush(): boolean { return true; }
    public parse(wrapper: IMessageDataWrapper): boolean { return !!wrapper; }
}
