import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { ImpostorMessageParser } from '../../parser/roomevents/ImpostorMessageParser';

export class ImpostorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ImpostorMessageParser);
    }

    public getParser(): ImpostorMessageParser
    {
        return this.parser as ImpostorMessageParser;
    }
}
