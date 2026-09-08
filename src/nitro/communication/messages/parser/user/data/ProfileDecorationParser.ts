import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class ProfileDecorationParser implements IMessageParser
{
    private _userId: number;
    private _backgroundId: number;
    private _standId: number;
    private _overlayId: number;

    public flush(): boolean
    {
        this._userId = 0;
        this._backgroundId = 0;
        this._standId = 0;
        this._overlayId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();
        this._backgroundId = wrapper.readInt();
        this._standId = wrapper.readInt();
        this._overlayId = wrapper.readInt();

        return true;
    }

    public get userId(): number { return this._userId; }
    public get backgroundId(): number { return this._backgroundId; }
    public get standId(): number { return this._standId; }
    public get overlayId(): number { return this._overlayId; }
}
