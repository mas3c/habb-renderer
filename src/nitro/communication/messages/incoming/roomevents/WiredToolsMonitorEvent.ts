import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { WiredToolsMonitorParser } from '../../parser';

export class WiredToolsMonitorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredToolsMonitorParser);
    }

    public getParser(): WiredToolsMonitorParser
    {
        return this.parser as WiredToolsMonitorParser;
    }
}
