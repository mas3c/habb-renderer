import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** La estela al andar de un avatar de la sala: índice + «efecto|color» (vacío = ninguna). */
export class RoomEstelaMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _estela: string;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._estela = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._estela = wrapper.readString();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get estela(): string { return this._estela; }
}
