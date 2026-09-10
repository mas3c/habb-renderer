import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { WiredToolsAccessParser } from '../../parser';

export class WiredToolsAccessEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredToolsAccessParser);
    }

    public getParser(): WiredToolsAccessParser { return this.parser as WiredToolsAccessParser; }
}
