import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Alguien de la sala ha usado un Habbicon (RoomUseHabbicon del AIR): su índice en la sala y el id. */
export class RoomHabbiconMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _habbiconId: number;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._habbiconId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._habbiconId = wrapper.readInt();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get habbiconId(): number { return this._habbiconId; }
}
