import { RoomObjectWidgetRequestEvent } from '../../../../../events';
import { FurnitureMultiStateLogic } from './FurnitureMultiStateLogic';

/**
 * conf_area_hide («Esconder área en la sala»). Sus datos son un NumberDataType de 8 valores:
 * [estado, x, y, ancho, largo, invisible, objetos de pared, invertir]. La zona la aplica el
 * RoomEngine (applyAreaHide); aquí solo se abre la ventana al usarlo.
 */
export class FurnitureAreaHideLogic extends FurnitureMultiStateLogic
{
    public getEventTypes(): string[]
    {
        return this.mergeTypes(super.getEventTypes(), [ RoomObjectWidgetRequestEvent.AREA_HIDE ]);
    }

    public useObject(): void
    {
        if(!this.object || !this.eventDispatcher) return;

        this.eventDispatcher.dispatchEvent(new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.AREA_HIDE, this.object));
    }
}
