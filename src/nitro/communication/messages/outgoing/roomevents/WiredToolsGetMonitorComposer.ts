import { IMessageComposer } from '../../../../../api';

// wired-tools port, Parte 3 — pide la telemetría del motor wired de la sala.
// action: 0 = solo consultar, 1 = vaciar los contadores antes de responder.
export class WiredToolsGetMonitorComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(action: number = 0) { this._data = [ action ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
