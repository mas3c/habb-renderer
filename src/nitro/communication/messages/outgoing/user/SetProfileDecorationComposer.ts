import { IMessageComposer } from '../../../../../api';

export class SetProfileDecorationComposer implements IMessageComposer<ConstructorParameters<typeof SetProfileDecorationComposer>>
{
    private _data: ConstructorParameters<typeof SetProfileDecorationComposer>;

    constructor(backgroundId: number, standId: number, overlayId: number, infostandMiniCode: string, infostandProfileCode: string)
    {
        this._data = [ backgroundId, standId, overlayId, infostandMiniCode, infostandProfileCode ];
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
