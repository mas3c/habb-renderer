import { IMessageComposer } from '../../../../../api';

// wired-tools port, Parte 5 (pestaña "Ajustes") — aplica la config de rate-limit
// de efectos wired de la sala. El servidor responde con la telemetría (cabecera
// 5913, WiredToolsMonitorEvent) que ya lleva estos dos campos.
export class WiredToolsSetSettingsComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(rateLimitActive: boolean, limitExecutions: number)
    {
        this._data = [ rateLimitActive, limitExecutions ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
