import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { HotelViewReclamoMessageParser } from '../../parser/hotelview/HotelViewReclamoMessageParser';

export class HotelViewReclamoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelViewReclamoMessageParser);
    }

    public getParser(): HotelViewReclamoMessageParser
    {
        return this.parser as HotelViewReclamoMessageParser;
    }
}
