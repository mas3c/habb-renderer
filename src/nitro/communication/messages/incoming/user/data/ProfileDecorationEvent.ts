import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { ProfileDecorationParser } from '../../../parser';

export class ProfileDecorationEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileDecorationParser);
    }

    public getParser(): ProfileDecorationParser
    {
        return this.parser as ProfileDecorationParser;
    }
}
