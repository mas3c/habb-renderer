import { IMessageComposer } from '../../../../../api';

/** Auras del avatar: acción (0 pedir el catálogo, 1 comprar, 2 ponérsela; id 0 = quitarla) + id. */
export class AurasComposer implements IMessageComposer<ConstructorParameters<typeof AurasComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;

    private _data: ConstructorParameters<typeof AurasComposer>;

    constructor(accion: number, auraId: number)
    {
        this._data = [ accion, auraId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
