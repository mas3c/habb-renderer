import { IMessageComposer } from '../../../../../../api';

export class RoomBuilderSetStateComposer implements IMessageComposer<ConstructorParameters<typeof RoomBuilderSetStateComposer>>
{
    private _data: ConstructorParameters<typeof RoomBuilderSetStateComposer>;

    constructor(itemId: number, state: number)
    {
        this._data = [ itemId, state ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
