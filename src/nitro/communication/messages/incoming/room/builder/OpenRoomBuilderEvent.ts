import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { OpenRoomBuilderParser } from '../../../parser';

export class OpenRoomBuilderEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, OpenRoomBuilderParser);
    }

    public getParser(): OpenRoomBuilderParser
    {
        return this.parser as OpenRoomBuilderParser;
    }
}
