import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { SnowWarGameResultTeamData } from './SnowWarGameResultTeamData';

/**
 * Final results (5022): seconds until the results screen closes and the
 * teams with their players. The official Game2GameEnding extras follow as an
 * optional tail so older servers still parse: playerWithMostHits,
 * playerWithMostKills and per player (userId, figure, gender, snowballHits,
 * kills, skillLevel) merged into the matching team player rows.
 */
export class SnowWarOnGameEndingParser implements IMessageParser
{
    private _secondsToResults: number;
    private _teams: SnowWarGameResultTeamData[];
    private _playerWithMostHits: number;
    private _playerWithMostKills: number;
    private _hasPlayerStats: boolean;

    public flush(): boolean
    {
        this._secondsToResults = 0;
        this._teams = [];
        this._playerWithMostHits = 0;
        this._playerWithMostKills = 0;
        this._hasPlayerStats = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._secondsToResults = wrapper.readInt();

        let totalTeams = wrapper.readInt();

        while(totalTeams > 0)
        {
            this._teams.push(new SnowWarGameResultTeamData(wrapper));

            totalTeams--;
        }

        // Optional Game2GameEnding stats tail (AIR Game2SnowWarGameStats + Game2PlayerStatsData subset).
        if(!wrapper.bytesAvailable) return true;

        this._playerWithMostHits = wrapper.readInt();
        this._playerWithMostKills = wrapper.readInt();
        this._hasPlayerStats = true;

        let totalStats = wrapper.readInt();

        while(totalStats > 0)
        {
            const userId = wrapper.readInt();
            const figure = wrapper.readString();
            const gender = wrapper.readString();
            const snowballHits = wrapper.readInt();
            const kills = wrapper.readInt();
            const skillLevel = wrapper.readInt();

            for(const team of this._teams)
            {
                for(const player of team.players)
                {
                    if(player.userId === userId) player.applyStats(figure, gender, snowballHits, kills, skillLevel);
                }
            }

            totalStats--;
        }

        return true;
    }

    public get secondsToResults(): number
    {
        return this._secondsToResults;
    }

    public get teams(): SnowWarGameResultTeamData[]
    {
        return this._teams;
    }

    /** User id of the player with the most snowball hits (0 when the server sent no stats). */
    public get playerWithMostHits(): number
    {
        return this._playerWithMostHits;
    }

    /** User id of the player with the most knock-outs (0 when the server sent no stats). */
    public get playerWithMostKills(): number
    {
        return this._playerWithMostKills;
    }

    public get hasPlayerStats(): boolean
    {
        return this._hasPlayerStats;
    }
}
