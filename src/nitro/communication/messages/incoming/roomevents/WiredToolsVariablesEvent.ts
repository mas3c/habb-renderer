import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { WiredToolsVariablesParser } from '../../parser';

export class WiredToolsVariablesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredToolsVariablesParser);
    }

    public getParser(): WiredToolsVariablesParser
    {
        return this.parser as WiredToolsVariablesParser;
    }
}
