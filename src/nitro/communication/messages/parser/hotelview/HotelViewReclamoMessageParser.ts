import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Portada: resultado de reclamar un premio (JSON: ok, mensaje, bloque, clave). */
export class HotelViewReclamoMessageParser implements IMessageParser
{
    private _json: string;

    public flush(): boolean
    {
        this._json = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._json = wrapper.readString();

        return true;
    }

    public get json(): string { return this._json; }
}
