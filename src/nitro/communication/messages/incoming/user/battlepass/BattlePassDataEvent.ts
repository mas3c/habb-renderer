import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { BattlePassDataParser } from '../../../parser/user/battlepass/BattlePassDataParser';

export class BattlePassDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BattlePassDataParser);
    }

    public getParser(): BattlePassDataParser
    {
        return this.parser as BattlePassDataParser;
    }
}
