import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { BattlePassStatusParser } from '../../../parser/user/battlepass/BattlePassStatusParser';

export class BattlePassStatusEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BattlePassStatusParser);
    }

    public getParser(): BattlePassStatusParser
    {
        return this.parser as BattlePassStatusParser;
    }
}
