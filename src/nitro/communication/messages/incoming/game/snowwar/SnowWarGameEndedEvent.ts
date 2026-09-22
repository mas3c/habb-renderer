import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarGameEndedParser } from '../../../parser';

export class SnowWarGameEndedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGameEndedParser);
    }

    public getParser(): SnowWarGameEndedParser
    {
        return this.parser;
    }
}
