import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export interface IBattlePassRewardRef
{
    id: number;
    name: string;
    image: string;
    type: string;
    quantity: number;
    /** Código de placa o id de furni, para pintar el icono real del premio. */
    iconRef: string;
}

export interface IBattlePassMissionRow
{
    id: number;
    category: string;
    name: string;
    description: string;
    image: string;
    /** Familia del objetivo (habbo_talk, room_visit...), para el icono del reto. */
    objectiveType: string;
    progress: number;
    total: number;
    rewardXp: number;
    completed: boolean;
}

export interface IBattlePassClaimRow
{
    claimId: number;
    tier: string;
    sourceId: number;
    reward: IBattlePassRewardRef;
}

export interface IBattlePassLadderRow
{
    level: number;
    reached: boolean;
    free: IBattlePassRewardRef;
    premium: IBattlePassRewardRef;
}

export class BattlePassDataParser implements IMessageParser
{
    private _seasonName: string;
    private _seasonDescription: string;
    private _banner: string;
    private _endsAt: number;
    private _username: string;
    private _figure: string;
    private _level: number;
    private _maxLevel: number;
    private _xp: number;
    private _xpRequired: number;
    private _totalXp: number;
    private _premium: boolean;
    private _premiumEnabled: boolean;
    private _maxLevelReached: number;
    private _rankPosition: number;
    private _completedMissions: number;
    private _missions: IBattlePassMissionRow[];
    private _claims: IBattlePassClaimRow[];
    private _ladder: IBattlePassLadderRow[];

    public flush(): boolean
    {
        this._seasonName = '';
        this._seasonDescription = '';
        this._banner = '';
        this._endsAt = 0;
        this._username = '';
        this._figure = '';
        this._level = 0;
        this._maxLevel = 0;
        this._xp = 0;
        this._xpRequired = 0;
        this._totalXp = 0;
        this._premium = false;
        this._premiumEnabled = false;
        this._maxLevelReached = 0;
        this._rankPosition = 0;
        this._completedMissions = 0;
        this._missions = [];
        this._claims = [];
        this._ladder = [];

        return true;
    }

    /** Un premio puede no existir en ese peldaño: viene precedido de un booleano. */
    private readReward(wrapper: IMessageDataWrapper): IBattlePassRewardRef
    {
        if(!wrapper.readBoolean()) return null;

        return {
            id: wrapper.readInt(),
            name: wrapper.readString(),
            image: wrapper.readString(),
            type: wrapper.readString(),
            quantity: wrapper.readInt(),
            iconRef: wrapper.readString()
        };
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._seasonName = wrapper.readString();
        this._seasonDescription = wrapper.readString();
        this._banner = wrapper.readString();
        this._endsAt = wrapper.readInt();

        this._username = wrapper.readString();
        this._figure = wrapper.readString();
        this._level = wrapper.readInt();
        this._maxLevel = wrapper.readInt();
        this._xp = wrapper.readInt();
        this._xpRequired = wrapper.readInt();
        this._totalXp = wrapper.readInt();
        this._premium = wrapper.readBoolean();
        this._premiumEnabled = wrapper.readBoolean();

        this._maxLevelReached = wrapper.readInt();
        this._rankPosition = wrapper.readInt();
        this._completedMissions = wrapper.readInt();

        this._missions = [];

        let count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._missions.push({
                id: wrapper.readInt(),
                category: wrapper.readString(),
                name: wrapper.readString(),
                description: wrapper.readString(),
                image: wrapper.readString(),
                objectiveType: wrapper.readString(),
                progress: wrapper.readInt(),
                total: wrapper.readInt(),
                rewardXp: wrapper.readInt(),
                completed: wrapper.readBoolean()
            });
        }

        this._claims = [];

        count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._claims.push({
                claimId: wrapper.readInt(),
                tier: wrapper.readString(),
                sourceId: wrapper.readInt(),
                reward: this.readReward(wrapper)
            });
        }

        this._ladder = [];

        count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._ladder.push({
                level: wrapper.readInt(),
                reached: wrapper.readBoolean(),
                free: this.readReward(wrapper),
                premium: this.readReward(wrapper)
            });
        }

        return true;
    }

    public get seasonName(): string { return this._seasonName; }
    public get seasonDescription(): string { return this._seasonDescription; }
    public get banner(): string { return this._banner; }
    public get endsAt(): number { return this._endsAt; }
    public get username(): string { return this._username; }
    public get figure(): string { return this._figure; }
    public get level(): number { return this._level; }
    public get maxLevel(): number { return this._maxLevel; }
    public get xp(): number { return this._xp; }
    public get xpRequired(): number { return this._xpRequired; }
    public get totalXp(): number { return this._totalXp; }
    public get premium(): boolean { return this._premium; }
    public get premiumEnabled(): boolean { return this._premiumEnabled; }
    public get maxLevelReached(): number { return this._maxLevelReached; }
    public get rankPosition(): number { return this._rankPosition; }
    public get completedMissions(): number { return this._completedMissions; }
    public get missions(): IBattlePassMissionRow[] { return this._missions; }
    public get claims(): IBattlePassClaimRow[] { return this._claims; }
    public get ladder(): IBattlePassLadderRow[] { return this._ladder; }
}
