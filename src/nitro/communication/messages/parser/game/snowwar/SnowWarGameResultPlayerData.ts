import { IMessageDataWrapper } from '../../../../../../api';

/**
 * One player row of the results screen. The base record is (userId, name,
 * score); the official Game2TeamPlayerData extras (figure, gender and the
 * Game2PlayerStatsData hits / kills plus the lobby skill level) arrive in the
 * optional stats tail of SnowWarOnGameEndingParser and are merged in by
 * applyStats, so they stay undefined against older servers.
 */
export class SnowWarGameResultPlayerData
{
    private _userId: number;
    private _name: string;
    private _score: number;
    private _figure: string = undefined;
    private _gender: string = undefined;
    private _snowballHits: number = undefined;
    private _kills: number = undefined;
    private _skillLevel: number = undefined;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._userId = wrapper.readInt();
        this._name = wrapper.readString();
        this._score = wrapper.readInt();
    }

    public applyStats(figure: string, gender: string, snowballHits: number, kills: number, skillLevel: number): void
    {
        this._figure = figure;
        this._gender = gender;
        this._snowballHits = snowballHits;
        this._kills = kills;
        this._skillLevel = skillLevel;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get name(): string
    {
        return this._name;
    }

    public get score(): number
    {
        return this._score;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get snowballHits(): number
    {
        return this._snowballHits;
    }

    public get kills(): number
    {
        return this._kills;
    }

    /** AIR GameLobbyPlayerData.skillLevel (1-30). */
    public get skillLevel(): number
    {
        return this._skillLevel;
    }
}
