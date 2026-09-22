import { IMessageComposer } from '../../../../../../api';

export class SnowWarExitEditorComposer implements IMessageComposer<[]>
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
