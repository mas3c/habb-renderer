import { AvatarAction, IRoomObjectSprite } from '../../../../../../api';
import { AvatarVisualization } from '../AvatarVisualization';
import { HabbiconAssets } from './HabbiconAssets';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * La burbuja de un Habbicon encima del avatar (HabbiconBubble del AIR): sube 12 px mientras
 * aparece (150 ms), se queda 3 s, se va en 350 ms y, si el Habbicon está animado, va pasando sus
 * fotogramas. Se dibuja centrada sobre la cabeza y baja con el avatar sentado o tumbado.
 */
const VISIBLE_MS = 3000, ENTRADA_MS = 180, APARECER_MS = 150, DESAPARECER_MS = 350, SUBIDA = 12;

export class HabbiconAddition implements IAvatarAddition
{
    private _id: number;
    private _habbiconId: number;
    private _secuencia: number;
    private _visualization: AvatarVisualization;
    private _inicio = 0;
    private _escala = 64;

    constructor(id: number, habbiconId: number, secuencia: number, visualization: AvatarVisualization)
    {
        this._id = id;
        this._habbiconId = habbiconId;
        this._secuencia = secuencia;
        this._visualization = visualization;
        HabbiconAssets.cargar();
    }

    public dispose(): void
    {
        this._visualization = null;
    }

    /** Dirección hacia la que mira el avatar, como el AIR: 1 derecha, -1 izquierda, 0 de frente o de espaldas. */
    private get mira(): number
    {
        const d = ((this._visualization?.direction ?? 0) % 8 + 8) % 8;

        if(d <= 2) return 1;
        if((d >= 4) && (d <= 6)) return -1;

        return 0;
    }

    private pintar(sprite: IRoomObjectSprite): boolean
    {
        const ms = Date.now() - this._inicio;
        const pequena = (this._escala < 48);
        const def = HabbiconAssets.definicion(this._habbiconId);
        const espejo = !!def && (this.mira !== 0) && (def.dir !== 0) && (this.mira !== def.dir);
        const textura = HabbiconAssets.textura(this._habbiconId, HabbiconAssets.fotograma(this._habbiconId, ms), pequena, espejo);

        if(!textura || (ms > (VISIBLE_MS + DESAPARECER_MS)))
        {
            sprite.visible = false;

            return !textura && (ms <= VISIBLE_MS);
        }

        // la parte de abajo de la burbuja, justo encima de la cabeza (como la burbuja de número:
        // ~89 px sobre los pies); la imagen lleva 7 px de margen por el contorno y la sombra
        let base = pequena ? -41 : -82;

        if(this._visualization.posture === AvatarAction.POSTURE_SIT) base += (pequena ? 16 : 32);
        else if(this._visualization.posture === AvatarAction.POSTURE_LAY) base += this._escala;

        const subida = (ms < ENTRADA_MS) ? Math.round(SUBIDA * (1 - (ms / ENTRADA_MS))) : 0;
        const alpha = (ms < APARECER_MS) ? (ms / APARECER_MS) : (ms > VISIBLE_MS) ? (1 - ((ms - VISIBLE_MS) / DESAPARECER_MS)) : 1;

        sprite.visible = true;
        sprite.texture = textura;
        sprite.offsetX = -Math.round(textura.width / 2);
        sprite.offsetY = base - textura.height + subida;
        sprite.relativeDepth = -0.2;
        sprite.alpha = Math.max(0, Math.min(255, Math.round(alpha * 255)));

        return true;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        if(!sprite) return;

        this._escala = scale;

        if(!this._inicio) this._inicio = Date.now();

        this.pintar(sprite);
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        if(!sprite || !this._visualization) return false;

        return this.pintar(sprite);
    }

    public get id(): number
    {
        return this._id;
    }

    public get habbiconId(): number
    {
        return this._habbiconId;
    }

    public get secuencia(): number
    {
        return this._secuencia;
    }
}
