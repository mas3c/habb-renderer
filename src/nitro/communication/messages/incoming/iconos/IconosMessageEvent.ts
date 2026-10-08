import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { IconosMessageParser } from '../../parser/iconos/IconosMessageParser';

export class IconosMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IconosMessageParser);
    }

    public getParser(): IconosMessageParser
    {
        return this.parser as IconosMessageParser;
    }
}
