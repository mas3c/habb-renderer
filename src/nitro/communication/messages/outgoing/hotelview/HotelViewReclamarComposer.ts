import { IMessageComposer } from '../../../../../api';

/** Portada: reclamar un premio de un bloque (id del bloque + clave: horas del hito o «premio» del Mega Rare). */
export class HotelViewReclamarComposer implements IMessageComposer<ConstructorParameters<typeof HotelViewReclamarComposer>>
{
    private _data: ConstructorParameters<typeof HotelViewReclamarComposer>;

    constructor(bloqueId: number, clave: string)
    {
        this._data = [ bloqueId, clave ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
