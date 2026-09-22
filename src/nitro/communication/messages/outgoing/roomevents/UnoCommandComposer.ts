import { IMessageComposer } from '../../../../../api';

/** UNO del centro de juegos: subcomando + argumento (emulador: UnoManager.CMD_*). */
export class UnoCommandComposer implements IMessageComposer<ConstructorParameters<typeof UnoCommandComposer>>
{
    private _data: ConstructorParameters<typeof UnoCommandComposer>;

    constructor(cmd: number, arg: string = '')
    {
        this._data = [ cmd, arg ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
