import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Iconos del chat: cajas con sus premios, los tuyos, el puesto y el resultado de la última acción (JSON). */
export class IconosMessageParser implements IMessageParser
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
