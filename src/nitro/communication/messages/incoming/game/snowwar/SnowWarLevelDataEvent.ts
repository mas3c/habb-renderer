import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarLevelDataParser } from '../../../parser';

export class SnowWarLevelDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarLevelDataParser);
    }

    public getParser(): SnowWarLevelDataParser
    {
        return this.parser as SnowWarLevelDataParser;
    }
}
