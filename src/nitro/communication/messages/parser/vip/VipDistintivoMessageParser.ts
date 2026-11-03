import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** El ajuste del propio jugador: si oculta su distintivo VIP. */
export class VipDistintivoMessageParser implements IMessageParser
{
    private _oculto: boolean;

    public flush(): boolean
    {
        this._oculto = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._oculto = wrapper.readBoolean();

        return true;
    }

    public get oculto(): boolean { return this._oculto; }
}
