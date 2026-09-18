import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { BattlePassMissionProgressParser } from '../../../parser/user/battlepass/BattlePassMissionProgressParser';

export class BattlePassMissionProgressEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BattlePassMissionProgressParser);
    }

    public getParser(): BattlePassMissionProgressParser
    {
        return this.parser as BattlePassMissionProgressParser;
    }
}
