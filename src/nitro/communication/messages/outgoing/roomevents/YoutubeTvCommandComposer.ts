import { IMessageComposer } from '../../../../../api';

/**
 * YouTube TV de sala. Un único paquete con subcomando:
 * 0 encender/apagar · 1 unirse · 2 salir · 3 añadir · 4 quitar ·
 * 5 siguiente · 6 anterior · 7 pausa · 8 pedir estado.
 */
export class YoutubeTvCommandComposer implements IMessageComposer<ConstructorParameters<typeof YoutubeTvCommandComposer>>
{
    private _data: ConstructorParameters<typeof YoutubeTvCommandComposer>;

    constructor(cmd: number, ...params: (string | number)[])
    {
        this._data = [ cmd, ...params ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
