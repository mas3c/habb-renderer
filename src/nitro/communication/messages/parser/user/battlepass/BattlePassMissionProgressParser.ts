import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class BattlePassMissionProgressParser implements IMessageParser
{
    private _missionId: number;
    private _name: string;
    private _image: string;
    private _category: string;
    private _progress: number;
    private _total: number;
    private _completed: boolean;
    private _xpGained: number;

    public flush(): boolean
    {
        this._missionId = 0;
        this._name = '';
        this._image = '';
        this._category = '';
        this._progress = 0;
        this._total = 0;
        this._completed = false;
        this._xpGained = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._missionId = wrapper.readInt();
        this._name = wrapper.readString();
        this._image = wrapper.readString();
        this._category = wrapper.readString();
        this._progress = wrapper.readInt();
        this._total = wrapper.readInt();
        this._completed = wrapper.readBoolean();
        this._xpGained = wrapper.readInt();

        return true;
    }

    public get missionId(): number { return this._missionId; }
    public get name(): string { return this._name; }
    public get image(): string { return this._image; }
    public get category(): string { return this._category; }
    public get progress(): number { return this._progress; }
    public get total(): number { return this._total; }
    public get completed(): boolean { return this._completed; }
    public get xpGained(): number { return this._xpGained; }
}
