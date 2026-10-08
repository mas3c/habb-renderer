import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** La aura de un avatar de la sala: índice, filtro (vacío = sin aura), color y si es fijo. */
export class RoomAuraMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _filtro: string;
    private _color: string;
    private _coloreable: number;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._filtro = '';
        this._color = '';
        this._coloreable = 1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._filtro = wrapper.readString();
        this._color = wrapper.readString();
        this._coloreable = wrapper.readInt();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }

    /** la cadena que entiende AvatarAura.crear («filtro|color|coloreable»), o vacía */
    public get aura(): string { return this._filtro ? `${ this._filtro }|${ this._color }|${ this._coloreable }` : ''; }
}
