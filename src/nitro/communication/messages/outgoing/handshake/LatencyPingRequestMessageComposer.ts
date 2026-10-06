import { IMessageComposer } from '../../../../../api';

/** LatencyPingRequest de Habbo: el cliente manda un número y el servidor lo devuelve tal cual. */
export class LatencyPingRequestMessageComposer implements IMessageComposer<ConstructorParameters<typeof LatencyPingRequestMessageComposer>>
{
    private _data: ConstructorParameters<typeof LatencyPingRequestMessageComposer>;

    constructor(id: number)
    {
        this._data = [ id ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
