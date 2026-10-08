import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** El icono del chat de un avatar de la sala: índice e id del icono (0 = ninguno). */
export class RoomIconoMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _iconoId: number;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._iconoId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._iconoId = wrapper.readInt();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get iconoId(): number { return this._iconoId; }
}
