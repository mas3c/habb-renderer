import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { UnoMessageParser } from '../../parser/roomevents/UnoMessageParser';

/** Menciones y bloqueados de habb.tv: una cadena JSON, como el UNO (emulador: MencionesManager). */
export class MencionesMessageEvent extends MessageEvent implements IMessageEvent
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
