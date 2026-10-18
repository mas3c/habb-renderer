import { IMessageComposer } from '../../../../../api';

// Editar un mensaje del foro de grupo (como Hartico): grupo, tema, mensaje, texto nuevo. Comet responde con el 324.
export class EditMessageMessageComposer implements IMessageComposer<ConstructorParameters<typeof EditMessageMessageComposer>>
{
    private _data: ConstructorParameters<typeof EditMessageMessageComposer>;

    constructor(groupId: number, threadId: number, messageId: number, message: string)
    {
        this._data = [ groupId, threadId, messageId, message ];
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
