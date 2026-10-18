import { IMessageComposer } from '../../../../../api';

export class UpdateThreadMessageComposer implements IMessageComposer<ConstructorParameters<typeof UpdateThreadMessageComposer>>
{
    private _data: ConstructorParameters<typeof UpdateThreadMessageComposer>;

    // (grupo, tema, fijado, bloqueado): Comet lo lee en este orden; antes se mandaba al revés y fijar bloqueaba
    constructor(k: number, _arg_2: number, _arg_3: boolean, _arg_4: boolean)
    {
        this._data = [k, _arg_2, _arg_3, _arg_4];
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
