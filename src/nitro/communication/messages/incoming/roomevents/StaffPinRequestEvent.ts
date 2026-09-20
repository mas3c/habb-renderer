import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { StaffPinRequestParser } from '../../parser/roomevents/StaffPinRequestParser';

export class StaffPinRequestEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, StaffPinRequestParser);
    }

    public getParser(): StaffPinRequestParser
    {
        return this.parser as StaffPinRequestParser;
    }
}
