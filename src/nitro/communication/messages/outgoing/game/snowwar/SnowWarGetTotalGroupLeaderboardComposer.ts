import { IMessageComposer } from '../../../../../../api';

export class SnowWarGetTotalGroupLeaderboardComposer implements IMessageComposer<ConstructorParameters<typeof SnowWarGetTotalGroupLeaderboardComposer>>
{
    private _data: ConstructorParameters<typeof SnowWarGetTotalGroupLeaderboardComposer>;

    constructor(gameTypeId: number, startRank: number, direction: number, viewSize: number, windowSize: number)
    {
        this._data = [ gameTypeId, startRank, direction, viewSize, windowSize ];
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
