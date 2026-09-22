import { IMessageEvent } from '../../../../../../api';
import { MessageEvent } from '../../../../../../events';
import { SnowWarLobbyTeamsParser } from '../../../parser';

export class SnowWarLobbyTeamsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SnowWarLobbyTeamsParser);
    }

    public getParser(): SnowWarLobbyTeamsParser
    {
        return this.parser as SnowWarLobbyTeamsParser;
    }
}
