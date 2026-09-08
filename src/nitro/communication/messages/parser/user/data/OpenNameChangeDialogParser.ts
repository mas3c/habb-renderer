import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class OpenNameChangeDialogParser implements IMessageParser
{
    private _isStaff: boolean;

    public flush(): boolean
    {
        this._isStaff = true;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        try { this._isStaff = wrapper.readBoolean(); } catch (e) { this._isStaff = true; }

        return true;
    }

    public get isStaff(): boolean
    {
        return this._isStaff;
    }
}
