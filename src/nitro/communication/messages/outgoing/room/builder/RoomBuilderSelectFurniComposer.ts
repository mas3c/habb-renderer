import { IMessageComposer } from '../../../../../../api';

export class RoomBuilderSelectFurniComposer implements IMessageComposer<ConstructorParameters<typeof RoomBuilderSelectFurniComposer>>
{
    private _data: ConstructorParameters<typeof RoomBuilderSelectFurniComposer>;

    constructor(itemId: number)
    {
        this._data = [ itemId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
