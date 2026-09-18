import { NitroEvent } from './core';

export class NitroSettingsEvent extends NitroEvent
{
    public static SETTINGS_UPDATED: string = 'NSE_SETTINGS_UPDATED';

    private _volumeSystem: number;
    private _volumeFurni: number;
    private _volumeTrax: number;
    private _oldChat: boolean;
    private _roomInvites: boolean;
    private _cameraFollow: boolean;
    private _flags: number;
    private _chatType: number;
    private _showOnline: boolean;
    private _allowFollow: boolean;
    private _allowFriendRequests: boolean;

    constructor()
    {
        super(NitroSettingsEvent.SETTINGS_UPDATED);
    }

    public clone(): NitroSettingsEvent
    {
        const clone = new NitroSettingsEvent();

        clone._volumeSystem = this._volumeSystem;
        clone._volumeFurni = this._volumeFurni;
        clone._volumeTrax = this._volumeTrax;
        clone._oldChat = this._oldChat;
        clone._roomInvites = this._roomInvites;
        clone._cameraFollow = this._cameraFollow;
        clone._flags = this._flags;
        clone._chatType = this._chatType;
        clone._showOnline = this._showOnline;
        clone._allowFollow = this._allowFollow;
        clone._allowFriendRequests = this._allowFriendRequests;

        return clone;
    }

    public get volumeSystem(): number
    {
        return this._volumeSystem;
    }

    public set volumeSystem(volume: number)
    {
        this._volumeSystem = volume;
    }

    public get volumeFurni(): number
    {
        return this._volumeFurni;
    }

    public set volumeFurni(volume: number)
    {
        this._volumeFurni = volume;
    }

    public get volumeTrax(): number
    {
        return this._volumeTrax;
    }

    public set volumeTrax(volume: number)
    {
        this._volumeTrax = volume;
    }

    public get oldChat(): boolean
    {
        return this._oldChat;
    }

    public set oldChat(value: boolean)
    {
        this._oldChat = value;
    }

    public get roomInvites(): boolean
    {
        return this._roomInvites;
    }

    public set roomInvites(value: boolean)
    {
        this._roomInvites = value;
    }

    public get cameraFollow(): boolean
    {
        return this._cameraFollow;
    }

    public set cameraFollow(value: boolean)
    {
        this._cameraFollow = value;
    }

    public get flags(): number
    {
        return this._flags;
    }

    public set flags(flags: number)
    {
        this._flags = flags;
    }

    public get chatType(): number
    {
        return this._chatType;
    }

    public set chatType(type: number)
    {
        this._chatType = type;
    }

    public get showOnline(): boolean
    {
        return this._showOnline;
    }

    public set showOnline(value: boolean)
    {
        this._showOnline = value;
    }

    public get allowFollow(): boolean
    {
        return this._allowFollow;
    }

    public set allowFollow(value: boolean)
    {
        this._allowFollow = value;
    }

    public get allowFriendRequests(): boolean
    {
        return this._allowFriendRequests;
    }

    public set allowFriendRequests(value: boolean)
    {
        this._allowFriendRequests = value;
    }
}
