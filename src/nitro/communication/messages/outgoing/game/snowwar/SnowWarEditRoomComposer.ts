import { IMessageComposer } from '../../../../../../api';

export class SnowWarEditRoomComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }
    public dispose(): void
    {
        return;
    }
}
