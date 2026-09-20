import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** 0 = mete el PIN · 1 = ese PIN no es · 2 = correcto, quita el aviso */
export class StaffPinRequestParser implements IMessageParser
{
    private _state: number;
    private _seconds: number;

    public flush(): boolean
    {
        this._state = 0;
        this._seconds = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._state = wrapper.readInt();
        this._seconds = wrapper.readInt();

        return true;
    }

    public get state(): number { return this._state; }
    public get seconds(): number { return this._seconds; }
}
