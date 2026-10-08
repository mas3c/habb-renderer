import { IMessageComposer } from '../../../../../api';

/** Iconos del chat: acción (0 pedir, 1 comprar la caja id, 2 ponerse el icono id —0 lo quita—, 3 regalar la caja id a `nombre`). */
export class IconosComposer implements IMessageComposer<ConstructorParameters<typeof IconosComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;
    public static REGALAR = 3;

    private _data: ConstructorParameters<typeof IconosComposer>;

    constructor(accion: number, id: number, nombre: string = '')
    {
        this._data = [ accion, id, nombre ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
