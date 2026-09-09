import { IMessageComposer } from '../../../../../api';

// wired-tools port, Parte 2 — pide al servidor la lista de variables wired de la sala.
export class WiredToolsGetVariablesComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor()
    {
        this._data = [];
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
