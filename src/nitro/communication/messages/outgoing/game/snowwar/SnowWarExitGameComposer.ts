import { IMessageComposer } from '../../../../../../api';

export class SnowWarExitGameComposer implements IMessageComposer<[]>
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
