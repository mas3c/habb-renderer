import { IMessageComposer } from '../../../../../../api';

export class SnowWarGetWeeklyGroupLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGetWeeklyGroupLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGetWeeklyGroupLeaderboardComposer>;

    constructor(gameTypeId: number, weekOffset: number, startRank: number, direction: number, viewSize: number, windowSize: number)
    {
        this._data = [ gameTypeId, weekOffset, startRank, direction, viewSize, windowSize ];
    }

    public getMessageArray()
    {
        return this._data;
    }
    public dispose(): void
    {
        this._data = null;
    }
}
