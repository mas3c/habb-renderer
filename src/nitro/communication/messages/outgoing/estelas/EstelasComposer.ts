import { IMessageComposer } from '../../../../../api';

/** Estelas al andar: acción (0 pedir el catálogo, 1 comprar, 2 ponérsela; id 0 = quitarla) + id. */
export class EstelasComposer implements IMessageComposer<ConstructorParameters<typeof EstelasComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;

    private _data: ConstructorParameters<typeof EstelasComposer>;

    constructor(accion: number, estelaId: number)
    {
        this._data = [ accion, estelaId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
