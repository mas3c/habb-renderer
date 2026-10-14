import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { HotelViewActualizarMessageParser } from '../../parser/hotelview/HotelViewActualizarMessageParser';

export class HotelViewActualizarMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelViewActualizarMessageParser);
    }

    public getParser(): HotelViewActualizarMessageParser
    {
        return this.parser as HotelViewActualizarMessageParser;
    }
}
