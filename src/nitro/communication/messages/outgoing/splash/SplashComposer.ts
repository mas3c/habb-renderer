import { IMessageComposer } from '../../../../../api';

/** Splash (entrada y salida de sala): acción (0 pedir el catálogo, 1 comprar, 2 ponérsela; id 0 = quitarla) + id. */
export class SplashComposer implements IMessageComposer<ConstructorParameters<typeof SplashComposer>>
{
    public static PEDIR = 0;
    public static COMPRAR = 1;
    public static PONER = 2;

    private _data: ConstructorParameters<typeof SplashComposer>;

    constructor(accion: number, splashId: number)
    {
        this._data = [ accion, splashId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
