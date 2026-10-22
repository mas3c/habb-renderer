import { IMessageEvent } from '../../../../../api';
import { MessageEvent } from '../../../../../events';
import { VariableLeaderboardMessageParser } from '../../parser/leaderboard/VariableLeaderboardMessageParser';

export class VariableLeaderboardTrozoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VariableLeaderboardMessageParser);
    }

    public getParser(): VariableLeaderboardMessageParser
    {
        return this.parser as VariableLeaderboardMessageParser;
    }
}
