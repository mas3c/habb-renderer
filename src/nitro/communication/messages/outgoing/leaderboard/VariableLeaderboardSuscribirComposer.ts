import { IMessageComposer } from '../../../../../api';

/** Tablas de clasificación: {"id":0} pide la lista de la sala; {"id","rev","v","chunks"} pide trozos de 50 filas de una variable. */
export class VariableLeaderboardSuscribirComposer implements IMessageComposer<ConstructorParameters<typeof VariableLeaderboardSuscribirComposer>>
{
    private _data: ConstructorParameters<typeof VariableLeaderboardSuscribirComposer>;

    constructor(json: string)
    {
        this._data = [ json ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
