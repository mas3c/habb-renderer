import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomHabbiconMessageParser } from '../../parser/roomevents/RoomHabbiconMessageParser';

export class RoomHabbiconMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomHabbiconMessageParser);
    }

    public getParser(): RoomHabbiconMessageParser
    {
        return this.parser as RoomHabbiconMessageParser;
    }
}
