import { IMessageComposer } from '../../../../../../api';

export class RoomBuilderRequestCatalogPageComposer implements IMessageComposer<ConstructorParameters<typeof RoomBuilderRequestCatalogPageComposer>>
{
    private _data: ConstructorParameters<typeof RoomBuilderRequestCatalogPageComposer>;

    constructor(baseItemId: number)
    {
        this._data = [ baseItemId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
