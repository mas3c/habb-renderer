import { IMessageComposer } from '../../../../../../api';

export class GetBattlePassDataComposer implements IMessageComposer<ConstructorParameters<typeof GetBattlePassDataComposer>>
{
    private _data: ConstructorParameters<typeof GetBattlePassDataComposer>;

    constructor()
    {
        this._data = [];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
