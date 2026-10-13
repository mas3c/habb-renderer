import { IMessageComposer } from '../../../../../api';

/** Colores de nombre: acción (0 pedir, 1 comprar y ponérselo, 2 ponérselo; id 0 = quitarlo) + id. */
export class ColoresNombreComposer implements IMessageComposer<ConstructorParameters<typeof ColoresNombreComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;

    private _data: ConstructorParameters<typeof ColoresNombreComposer>;

    constructor(accion: number, colorId: number)
    {
        this._data = [ accion, colorId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
