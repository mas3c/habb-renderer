import { IMessageComposer } from '../../../../../api';

/** El PIN que teclea el staff cuando el emulador se lo pide. */
export class StaffPinComposer implements IMessageComposer<ConstructorParameters<typeof StaffPinComposer>>
{
    private _data: ConstructorParameters<typeof StaffPinComposer>;

    constructor(pin: string)
    {
        this._data = [ pin ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
