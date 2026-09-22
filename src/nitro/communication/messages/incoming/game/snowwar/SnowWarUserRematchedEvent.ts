import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarUserRematchedParser } from '../../../parser';

export class SnowWarUserRematchedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarUserRematchedParser);
    }

    public getParser(): SnowWarUserRematchedParser
    {
        return this.parser as SnowWarUserRematchedParser;
    }
}
