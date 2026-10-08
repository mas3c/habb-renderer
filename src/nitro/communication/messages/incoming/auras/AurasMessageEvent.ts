import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { AurasMessageParser } from '../../parser/auras/AurasMessageParser';

export class AurasMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AurasMessageParser);
    }

    public getParser(): AurasMessageParser
    {
        return this.parser as AurasMessageParser;
    }
}
