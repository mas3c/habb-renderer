import { ObjectStateUpdateMessage } from './ObjectStateUpdateMessage';

/** Le han puesto o quitado una estela al andar (AvatarEstela: «efecto|color», vacía = ninguna). */
export class ObjectAvatarEstelaUpdateMessage extends ObjectStateUpdateMessage
{
    private _estela: string;

    constructor(estela: string)
    {
        super();

        this._estela = estela;
    }

    public get estela(): string
    {
        return this._estela;
    }
}
