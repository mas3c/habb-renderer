import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarGamesInformationParser } from '../../../parser';

export class SnowWarGamesInformationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarGamesInformationParser);
    }

    public getParser(): SnowWarGamesInformationParser
    {
        return this.parser as SnowWarGamesInformationParser;
    }
}
