import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

// wired-tools port — máscaras de acceso Wired de la sala (pestaña "Settings").
// Bits: 1 EVERYONE (solo inspect) · 2 rights · 4 group members · 8 group admins.
export class WiredToolsAccessParser implements IMessageParser
{
    private _inspectMask: number = 0;
    private _modifyMask: number = 0;
    private _canModify: boolean = false;

    public flush(): boolean { this._inspectMask = 0; this._modifyMask = 0; this._canModify = false; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        this._inspectMask = wrapper.readInt();
        this._modifyMask = wrapper.readInt();
        this._canModify = wrapper.readBoolean();
        return true;
    }

    public get inspectMask(): number { return this._inspectMask; }
    public get modifyMask(): number { return this._modifyMask; }
    public get canModify(): boolean { return this._canModify; }
}
