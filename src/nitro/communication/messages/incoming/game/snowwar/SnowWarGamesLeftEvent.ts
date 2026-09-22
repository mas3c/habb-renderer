import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarGamesLeftParser } from '../../../parser';

export class SnowWarGamesLeftEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGamesLeftParser);
    }

    public getParser(): SnowWarGamesLeftParser
    {
        return this.parser as SnowWarGamesLeftParser;
    }
}
