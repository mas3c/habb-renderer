import { IMessageComposer } from '../../../../../../api';

export class SnowWarRequestFullGameStatusComposer implements IMessageComposer<[]>
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
