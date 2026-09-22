import { IMessageComposer } from '../../../../../../api';

export class SnowWarPlayAgainComposer implements IMessageComposer<[]>
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
