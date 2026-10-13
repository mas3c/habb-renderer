import { IMessageComposer } from '../../../../../api';

/** Colores de nombre: acción (0 pedir, 1 comprar y ponérselo, 2 ponérselo; id 0 = quitarlo, 3 regalarlo) + id + nombre. */
export class ColoresNombreComposer implements IMessageComposer<ConstructorParameters<typeof ColoresNombreComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;
    public static REGALAR = 3;

    private _data: ConstructorParameters<typeof ColoresNombreComposer>;

    constructor(accion: number, colorId: number, nombre: string = '')
    {
        this._data = [ accion, colorId, nombre ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
