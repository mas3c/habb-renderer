import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { EstelasMessageParser } from '../../parser/estelas/EstelasMessageParser';

export class EstelasMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EstelasMessageParser);
    }

    public getParser(): EstelasMessageParser
    {
        return this.parser as EstelasMessageParser;
    }
}
