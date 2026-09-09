import { IMessageComposer } from '../../../../../api';

// wired-tools port, Parte 2b — crear/editar/borrar una variable wired de la sala.
// op: 'set' | 'delete'. El servidor responde con la lista completa (WiredToolsVariablesEvent).
export class WiredToolsVariableManageComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(op: string, scope: string, ownerId: number, name: string, value: string)
    {
        this._data = [ op, scope, ownerId, name, value ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
