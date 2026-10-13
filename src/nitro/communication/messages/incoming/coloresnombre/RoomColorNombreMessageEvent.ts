import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomColorNombreMessageParser } from '../../parser/coloresnombre/RoomColorNombreMessageParser';

export class RoomColorNombreMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomColorNombreMessageParser);
    }

    public getParser(): RoomColorNombreMessageParser
    {
        return this.parser as RoomColorNombreMessageParser;
    }
}
