import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarFullGameStatusParser } from '../../../parser';

export class SnowWarFullGameStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarFullGameStatusParser);
    }

    public getParser(): SnowWarFullGameStatusParser
    {
        return this.parser as SnowWarFullGameStatusParser;
    }
}
