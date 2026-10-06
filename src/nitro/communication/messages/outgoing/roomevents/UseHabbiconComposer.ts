import { IMessageComposer } from '../../../../../api';

/** Usar un Habbicon en la sala (TriggerHabbicon del AIR; emulador: UseHabbiconMessageEvent). */
export class UseHabbiconComposer implements IMessageComposer<ConstructorParameters<typeof UseHabbiconComposer>>
{
    private _data: ConstructorParameters<typeof UseHabbiconComposer>;

    constructor(habbiconId: number)
    {
        this._data = [ habbiconId ];
    }

    public getMessageArray() { return this._data; }
    public dispose(): void { return; }
}
