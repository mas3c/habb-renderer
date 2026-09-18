import { IMessageComposer } from '../../../../../../api';

export class GetBattlePassStatusComposer implements IMessageComposer<ConstructorParameters<typeof GetBattlePassStatusComposer>>
{
    private _data: ConstructorParameters<typeof GetBattlePassStatusComposer>;

    constructor()
    {
        this._data = [];
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
