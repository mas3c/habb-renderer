import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarRejoinPreviousRoomParser } from '../../../parser';

export class SnowWarRejoinPreviousRoomEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarRejoinPreviousRoomParser);
    }

    public getParser(): SnowWarRejoinPreviousRoomParser
    {
        return this.parser;
    }
}
