import { IMessageComposer } from '../../../../../api';

// wired-tools port, Parte 3 — pide la telemetría del motor wired de la sala.
export class WiredToolsGetMonitorComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor() { this._data = []; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
