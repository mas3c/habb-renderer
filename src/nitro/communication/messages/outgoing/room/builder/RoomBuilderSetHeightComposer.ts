import { IMessageComposer } from '../../../../../../api';

export class RoomBuilderSetHeightComposer implements IMessageComposer<ConstructorParameters<typeof RoomBuilderSetHeightComposer>>
{
    private _data: ConstructorParameters<typeof RoomBuilderSetHeightComposer>;

    constructor(itemId: number, height: string)
    {
        this._data = [ itemId, height ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
