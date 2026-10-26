import { RoomObjectVariable } from '../../../../../api';
import { FurnitureAnimatedVisualization } from '../furniture';

export class TileCursorVisualization extends FurnitureAnimatedVisualization
{
    private _tileHeight: number;

    constructor()
    {
        super();

        this._tileHeight = 0;
    }

    /**
     * El cursor viene hecho para pintarse muy por detrás (su z del asset, ~3 baldosas): en el suelo de siempre
     * da igual porque el suelo va detrás de todo, pero en un suelo elevado (escaleras) lo dejaba detrás de su
     * propio escalón. Ahí va justo delante de su baldosa y de las de al lado, y detrás de lo que está encima.
     */
    protected getLayerZOffset(scale: number, direction: number, layerId: number): number
    {
        const base = super.getLayerZOffset(scale, direction, layerId);

        if(!((this.object?.getLocation()?.z || 0) > 0)) return base;

        // un pelo por detrás de los avatares (-0.01) y por delante de las baldosas de al lado, que en una
        // rampa empatan con su centro
        return (-0.006 - (layerId * 0.0001));
    }

    protected getLayerYOffset(scale: number, direction: number, layerId: number): number
    {
        if(layerId === 1)
        {
            this._tileHeight = this.object.model.getValue<number>(RoomObjectVariable.TILE_CURSOR_HEIGHT);

            return -(this._tileHeight) * 32; // 32 = scale / 2
        }

        return super.getLayerYOffset(scale, direction, layerId);
    }
}
