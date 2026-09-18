import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class UserSettingsParser implements IMessageParser
{
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

    public flush(): boolean
    {
        this._volumeSystem = 0;
        this._volumeFurni = 0;
        this._volumeTrax = 0;
        this._oldChat = false;
        this._roomInvites = false;
        this._cameraFollow = false;
        this._flags = 0;
        this._chatType = 0;
        this._showOnline = true;
        this._allowFollow = true;
        this._allowFriendRequests = true;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._volumeSystem = wrapper.readInt();
        this._volumeFurni = wrapper.readInt();
        this._volumeTrax = wrapper.readInt();
        this._oldChat = wrapper.readBoolean();
        this._roomInvites = wrapper.readBoolean();
        this._cameraFollow = wrapper.readBoolean();
        this._flags = wrapper.readInt();
        this._chatType = wrapper.readInt();

        // «Ajustes personaje», en positivo y al final del paquete (513), igual que el
        // MeMenuSettingsComposer oficial. Un servidor que no los mande deja los valores
        // por defecto en vez de romper el parseo.
        if(wrapper.bytesAvailable)
        {
            this._showOnline = wrapper.readBoolean();
            this._allowFollow = wrapper.readBoolean();
            this._allowFriendRequests = wrapper.readBoolean();
        }

        return true;
    }

    public get volumeSystem(): number
    {
        return this._volumeSystem;
    }

    public get volumeFurni(): number
    {
        return this._volumeFurni;
    }

    public get volumeTrax(): number
    {
        return this._volumeTrax;
    }

    public get oldChat(): boolean
    {
        return this._oldChat;
    }

    public get roomInvites(): boolean
    {
        return this._roomInvites;
    }

    public get cameraFollow(): boolean
    {
        return this._cameraFollow;
    }

    public get flags(): number
    {
        return this._flags;
    }

    public get chatType(): number
    {
        return this._chatType;
    }

    public get showOnline(): boolean
    {
        return this._showOnline;
    }

    public get allowFollow(): boolean
    {
        return this._allowFollow;
    }

    public get allowFriendRequests(): boolean
    {
        return this._allowFriendRequests;
    }
}
