import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomIconoMessageParser } from '../../parser/iconos/RoomIconoMessageParser';

export class RoomIconoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomIconoMessageParser);
    }

    public getParser(): RoomIconoMessageParser
    {
        return this.parser as RoomIconoMessageParser;
    }
}
