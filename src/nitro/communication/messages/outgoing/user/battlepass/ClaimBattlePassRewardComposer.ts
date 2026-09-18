import { IMessageComposer } from '../../../../../../api';

/** Solo viaja el id de la reclamación: el servidor decide qué entrega. */
export class ClaimBattlePassRewardComposer implements IMessageComposer<ConstructorParameters<typeof ClaimBattlePassRewardComposer>>
{
    private _data: ConstructorParameters<typeof ClaimBattlePassRewardComposer>;

    constructor(claimId: number)
    {
        this._data = [claimId];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
