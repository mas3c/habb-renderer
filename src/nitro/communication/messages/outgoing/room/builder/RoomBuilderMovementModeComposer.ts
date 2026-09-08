import { IMessageComposer } from '../../../../../../api';

export class RoomBuilderMovementModeComposer implements IMessageComposer<ConstructorParameters<typeof RoomBuilderMovementModeComposer>>
{
    private _data: ConstructorParameters<typeof RoomBuilderMovementModeComposer>;

    constructor(mode: number)
    {
        this._data = [ mode ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
