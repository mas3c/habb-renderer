import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** El color de nombre de un avatar de la sala: índice + «tipo|color1|color2» (vacío = ninguno). */
export class RoomColorNombreMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _color: string;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._color = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._color = wrapper.readString();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get color(): string { return this._color; }
}
