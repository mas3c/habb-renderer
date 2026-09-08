import { IMessageComposer } from '../../../../../api';

export class SetProfileDecorationComposer implements IMessageComposer<ConstructorParameters<typeof SetProfileDecorationComposer>>
{
    private _data: ConstructorParameters<typeof SetProfileDecorationComposer>;

    constructor(backgroundId: number, standId: number, overlayId: number)
    {
        this._data = [ backgroundId, standId, overlayId ];
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
