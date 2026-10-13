import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { ColoresNombreMessageParser } from '../../parser/coloresnombre/ColoresNombreMessageParser';

export class ColoresNombreMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ColoresNombreMessageParser);
    }

    public getParser(): ColoresNombreMessageParser
    {
        return this.parser as ColoresNombreMessageParser;
    }
}
