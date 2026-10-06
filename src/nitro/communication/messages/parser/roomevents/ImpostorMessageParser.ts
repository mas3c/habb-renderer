import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** Impostor del centro de juegos: el emulador manda todo como una cadena JSON (ver ImpostorManager). */
export class ImpostorMessageParser implements IMessageParser
{
    private _json: string;

    public flush(): boolean
    {
        this._json = '';

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
