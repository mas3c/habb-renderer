import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { HabboGroupEntryData } from '../HabboGroupEntryData';

export class UserProfileParser implements IMessageParser
{
    private _id: number;
    private _username: string;
    private _figure: string;
    private _motto: string;
    private _registration: string;
    private _achievementPoints: number;
    private _friendsCount: number;
    private _isMyFriend: boolean;
    private _requestSent: boolean;
    private _isOnline: boolean;
    private _groups: HabboGroupEntryData[];
    private _secondsSinceLastVisit: number;
    private _openProfileWindow: boolean;
    private _battlePassLevel: number;
    private _respectsReceived: number;
    private _badgeCount: number;
    private _playTimeMinutes: number;

    public flush(): boolean
    {
        this._id = 0;
        this._username = null;
        this._figure = null;
        this._motto = null;
        this._registration = null;
        this._achievementPoints = 0;
        this._friendsCount = 0;
        this._isMyFriend = false;
        this._requestSent = false;
        this._isOnline = false;
        this._groups = [];
        this._secondsSinceLastVisit = 0;
        this._openProfileWindow = false;
        this._battlePassLevel = 0;
        this._respectsReceived = 0;
        this._badgeCount = -1;
        this._playTimeMinutes = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._id = wrapper.readInt();
        this._username = wrapper.readString();
        this._figure = wrapper.readString();
        this._motto = wrapper.readString();
        this._registration = wrapper.readString();
        this._achievementPoints = wrapper.readInt();
        this._friendsCount = wrapper.readInt();
        this._isMyFriend = wrapper.readBoolean();
        this._requestSent = wrapper.readBoolean();
        this._isOnline = wrapper.readBoolean();
        const groupsCount = wrapper.readInt();

        for(let i = 0; i < groupsCount; i++)
        {
            this._groups.push(new HabboGroupEntryData(wrapper));
        }

        this._secondsSinceLastVisit = wrapper.readInt();
        this._openProfileWindow = wrapper.readBoolean();

        // Nivel del Battle Pass, añadido al final por Habb. Se lee solo si viene, para
        // que el parser siga valiendo contra un emulador que no lo mande.
        if(wrapper.bytesAvailable) this._battlePassLevel = wrapper.readInt();

        // Respetos recibidos, detrás del nivel y por el mismo motivo: si el emulador
        // no los manda, el parser se para aquí y el perfil sigue funcionando.
        if(wrapper.bytesAvailable) this._respectsReceived = wrapper.readInt();

        // Total de placas (no solo las equipadas), mismo criterio. -1 = no vino.
        if(wrapper.bytesAvailable) this._badgeCount = wrapper.readInt();

        // Tiempo de juego en minutos (como Steam), mismo criterio. -1 = no vino.
        if(wrapper.bytesAvailable) this._playTimeMinutes = wrapper.readInt();

        return true;
    }

    public get id(): number
    {
        return this._id;
    }

    public get username(): string
    {
        return this._username;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get motto(): string
    {
        return this._motto;
    }

    public get registration(): string
    {
        return this._registration;
    }

    public get achievementPoints(): number
    {
        return this._achievementPoints;
    }

    public get friendsCount(): number
    {
        return this._friendsCount;
    }

    public get isMyFriend(): boolean
    {
        return this._isMyFriend;
    }

    public get requestSent(): boolean
    {
        return this._requestSent;
    }

    public get isOnline(): boolean
    {
        return this._isOnline;
    }

    public get groups(): HabboGroupEntryData[]
    {
        return this._groups;
    }

    public get secondsSinceLastVisit(): number
    {
        return this._secondsSinceLastVisit;
    }

    public get openProfileWindow(): boolean
    {
        return this._openProfileWindow;
    }

    public get battlePassLevel(): number
    {
        return this._battlePassLevel;
    }

    public get respectsReceived(): number
    {
        return this._respectsReceived;
    }

    public get badgeCount(): number
    {
        return this._badgeCount;
    }

    public get playTimeMinutes(): number
    {
        return this._playTimeMinutes;
    }

}
