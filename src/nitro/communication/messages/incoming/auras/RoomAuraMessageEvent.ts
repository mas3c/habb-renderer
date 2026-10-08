import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomAuraMessageParser } from '../../parser/auras/RoomAuraMessageParser';

export class RoomAuraMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomAuraMessageParser);
    }

    public getParser(): RoomAuraMessageParser
    {
        return this.parser as RoomAuraMessageParser;
    }
}
