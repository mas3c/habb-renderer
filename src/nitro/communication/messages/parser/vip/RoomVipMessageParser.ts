import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** El distintivo VIP de un avatar de la sala: índice + segundos de VIP que le quedan (0 = no tiene, o lo oculta). */
export class RoomVipMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _segundos: number;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._segundos = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._segundos = wrapper.readInt();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get segundos(): number { return this._segundos; }
}
