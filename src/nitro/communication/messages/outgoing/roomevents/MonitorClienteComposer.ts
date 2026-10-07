import { IMessageComposer } from '../../../../../api';

/** Monitor de la HK (9620): cada minuto, cómo le va al cliente (JSON: fps, peor segundo, ping, memoria, dispositivo). */
export class MonitorClienteComposer implements IMessageComposer<ConstructorParameters<typeof MonitorClienteComposer>>
{
    private _data: ConstructorParameters<typeof MonitorClienteComposer>;

    constructor(json: string)
    {
        this._data = [ json ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
