import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class BattlePassStatusParser implements IMessageParser
{
    private _enabled: boolean;
    private _seasonName: string;
    private _level: number;
    private _maxLevel: number;
    private _xp: number;
    private _xpRequired: number;
    private _pendingRewards: number;

    public flush(): boolean
    {
        this._enabled = false;
        this._seasonName = '';
        this._level = 0;
        this._maxLevel = 0;
        this._xp = 0;
        this._xpRequired = 0;
        this._pendingRewards = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._enabled = wrapper.readBoolean();
        this._seasonName = wrapper.readString();
        this._level = wrapper.readInt();
        this._maxLevel = wrapper.readInt();
        this._xp = wrapper.readInt();
        this._xpRequired = wrapper.readInt();
        this._pendingRewards = wrapper.readInt();

        return true;
    }

    public get enabled(): boolean { return this._enabled; }
    public get seasonName(): string { return this._seasonName; }
    public get level(): number { return this._level; }
    public get maxLevel(): number { return this._maxLevel; }
    public get xp(): number { return this._xp; }
    public get xpRequired(): number { return this._xpRequired; }
    public get pendingRewards(): number { return this._pendingRewards; }
}
