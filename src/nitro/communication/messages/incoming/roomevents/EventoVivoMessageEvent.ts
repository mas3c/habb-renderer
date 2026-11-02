import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { UnoMessageParser } from '../../parser/roomevents/UnoMessageParser';

/** Evento en directo (:event start/close): una cadena JSON, como el UNO (emulador: EventoVivo). */
export class EventoVivoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UnoMessageParser);
    }

    public getParser(): UnoMessageParser
    {
        return this.parser as UnoMessageParser;
    }
}
