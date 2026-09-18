import { IMessageComposer } from '../../../../../../api';

export class UserSettingsGamePrivacyComposer implements IMessageComposer<ConstructorParameters<typeof UserSettingsGamePrivacyComposer>>
{
    private _data: ConstructorParameters<typeof UserSettingsGamePrivacyComposer>;

    constructor(showOnline: boolean, allowFollow: boolean, allowFriendRequests: boolean)
    {
        this._data = [showOnline, allowFollow, allowFriendRequests];
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
