import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { RoomEstelaMessageParser } from '../../parser/estelas/RoomEstelaMessageParser';

export class RoomEstelaMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomEstelaMessageParser);
    }

    public getParser(): RoomEstelaMessageParser
    {
        return this.parser as RoomEstelaMessageParser;
    }
}
