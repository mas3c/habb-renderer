import { IMessageComposer } from '../../../../../api';

// wired-tools port — pestaña "Settings": lee/guarda las máscaras de acceso Wired.
// op: 0 = consultar, 1 = guardar (inspectMask, modifyMask). El servidor responde
// con las máscaras actuales (WiredToolsAccessEvent, cabecera 5916).
export class WiredToolsSettingsComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(op: number = 0, inspectMask: number = 0, modifyMask: number = 0)
    {
        this._data = [ op, inspectMask, modifyMask ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
