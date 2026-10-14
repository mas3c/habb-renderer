import { ObjectStateUpdateMessage } from './ObjectStateUpdateMessage';

/** Un avatar entra o sale con Splash: «fase|n|spec» (n distinto en cada uno, para que el mismo se repita). */
export class ObjectAvatarSplashUpdateMessage extends ObjectStateUpdateMessage
{
    private static _n = 0;

    private _valor: string;

    constructor(fase: string, splash: string)
    {
        super();

        this._valor = `${ fase }|${ ++ObjectAvatarSplashUpdateMessage._n }|${ splash }`;
    }

    public get valor(): string
    {
        return this._valor;
    }
}
