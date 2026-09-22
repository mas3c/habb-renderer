import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarQueuePositionParser } from '../../../parser';

export class SnowWarQueuePositionEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarQueuePositionParser);
    }

    public getParser(): SnowWarQueuePositionParser
    {
        return this.parser as SnowWarQueuePositionParser;
    }
}
