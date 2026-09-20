import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { YoutubeTvStateParser } from '../../parser/roomevents/YoutubeTvStateParser';

export class YoutubeTvStateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, YoutubeTvStateParser);
    }

    public getParser(): YoutubeTvStateParser
    {
        return this.parser as YoutubeTvStateParser;
    }
}
