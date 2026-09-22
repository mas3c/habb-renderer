import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { Game2GroupLeaderboardParser } from '../../../parser';

export class Game2TotalGroupLeaderboardEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, Game2GroupLeaderboardParser);
    }

    public getParser(): Game2GroupLeaderboardParser
    {
        return this.parser as Game2GroupLeaderboardParser;
    }
}
