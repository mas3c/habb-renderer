import { IMessageComposer } from '../../../../../api';

/** Distintivo VIP sobre el avatar: 0 pedir el ajuste, 1 mostrarlo, 2 ocultarlo. */
export class VipDistintivoComposer implements IMessageComposer<ConstructorParameters<typeof VipDistintivoComposer>>
{
    public static PEDIR = 0;
    public static MOSTRAR = 1;
    public static OCULTAR = 2;

    private _data: ConstructorParameters<typeof VipDistintivoComposer>;

    constructor(accion: number)
    {
        this._data = [ accion ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
