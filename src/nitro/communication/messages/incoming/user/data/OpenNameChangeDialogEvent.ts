import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { OpenNameChangeDialogParser } from '../../../parser';

export class OpenNameChangeDialogEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, OpenNameChangeDialogParser);
    }

    public getParser(): OpenNameChangeDialogParser
    {
        return this.parser as OpenNameChangeDialogParser;
    }
}
