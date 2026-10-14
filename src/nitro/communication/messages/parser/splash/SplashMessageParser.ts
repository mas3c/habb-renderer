import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Splash (entrada y salida de sala): catálogo, compradas, la puesta y el resultado de la última acción (JSON). */
export class SplashMessageParser implements IMessageParser
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
