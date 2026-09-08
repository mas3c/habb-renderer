import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { WiredFurniVariableParser } from '../../parser';

export class WiredFurniVariableEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniVariableParser);
    }

    public getParser(): WiredFurniVariableParser
    {
        return this.parser as WiredFurniVariableParser;
    }
}
