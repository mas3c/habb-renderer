import { IMessageComposer } from '../../../../../api';

/** Impostor del centro de juegos: subcomando + argumento (emulador: ImpostorManager.CMD_*). */
export class ImpostorCommandComposer implements IMessageComposer<ConstructorParameters<typeof ImpostorCommandComposer>>
{
    private _data: ConstructorParameters<typeof ImpostorCommandComposer>;

    constructor(cmd: number, arg: string = '')
    {
        this._data = [ cmd, arg ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
