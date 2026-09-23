import { IMessageComposer } from '../../../../../api';

/** Menciones y bloqueados de habb.tv: subcomando + argumento (emulador: MencionesManager.CMD_*). */
export class MencionesCommandComposer implements IMessageComposer<ConstructorParameters<typeof MencionesCommandComposer>>
{
    private _data: ConstructorParameters<typeof MencionesCommandComposer>;

    constructor(cmd: number, arg: string = '')
    {
        this._data = [ cmd, arg ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
