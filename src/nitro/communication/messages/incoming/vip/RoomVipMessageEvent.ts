import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomVipMessageParser } from '../../parser/vip/RoomVipMessageParser';

export class RoomVipMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomVipMessageParser);
    }

    public getParser(): RoomVipMessageParser
    {
        return this.parser as RoomVipMessageParser;
    }
}
