import { IMessageComposer } from '../../../../../../api';

// «Pulsar furni» de Habbo (ClickFurni): qué furni se ha pulsado. Sin él, el servidor lo deducía de la casilla bajo el
// ratón, que en un furni alto (máquina de tickets, tubos) es la de detrás.
export class ClickFurniMessageComposer implements IMessageComposer<ConstructorParameters<typeof ClickFurniMessageComposer>>
{
    private _data: ConstructorParameters<typeof ClickFurniMessageComposer>;

    constructor(objectId: number, category: number)
    {
        this._data = [ objectId, category ];
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
