import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { UnoMessageParser } from '../../parser/roomevents/UnoMessageParser';

export class UnoMessageEvent extends MessageEvent implements IMessageEvent
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
