import { ObjectStateUpdateMessage } from './ObjectStateUpdateMessage';

/** Le han puesto o quitado un aura (AvatarAura: «filtro|color|coloreable», vacía = ninguna). */
export class ObjectAvatarAuraUpdateMessage extends ObjectStateUpdateMessage
{
    private _aura: string;

    constructor(aura: string)
    {
        super();

        this._aura = aura;
    }

    public get aura(): string
    {
        return this._aura;
    }
}
