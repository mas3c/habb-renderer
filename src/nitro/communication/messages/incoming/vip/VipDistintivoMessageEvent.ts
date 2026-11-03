import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { VipDistintivoMessageParser } from '../../parser/vip/VipDistintivoMessageParser';

export class VipDistintivoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VipDistintivoMessageParser);
    }

    public getParser(): VipDistintivoMessageParser
    {
        return this.parser as VipDistintivoMessageParser;
    }
}
