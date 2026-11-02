import { Texture } from '@pixi/core';
import { IRoomObjectSprite } from '../../../../../../api';
import { AccionMotor } from '../AccionMotor';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * Las animaciones de :besar, :punch… (AccionMotor): un lienzo alrededor del keko (220 x 220 a escala 1, pies abajo en el
 * centro), por delante de él. Más ancho que el del Splash porque algunas van hacia el otro avatar.
 */
export class AccionAddition implements IAvatarAddition
{
    private static ANCHO = 220;
    private static ALTO = 220;
    private static PIES_Y = 180;

    private _escala = 64;
    private _lienzo: HTMLCanvasElement = null;
    private _textura: Texture = null;

    constructor(private _id: number, private _accion: any, private _datos: any, private _lado: number) {}

    public dispose(): void
    {
        if(this._textura) this._textura.destroy(true);

        this._textura = null;
        this._lienzo = null;
    }

    private get u(): number { return (this._escala / 64); }

    /** pinta el instante t (ms desde el principio) */
    public pintar(sprite: IRoomObjectSprite, t: number): void
    {
        if(!sprite) return;

        const ancho = Math.round(AccionAddition.ANCHO * this.u), alto = Math.round(AccionAddition.ALTO * this.u);

        if(!this._lienzo || (this._lienzo.width !== ancho))
        {
            if(this._textura) this._textura.destroy(true);

            this._lienzo = document.createElement('canvas');
            this._lienzo.width = ancho;
            this._lienzo.height = alto;
            this._textura = Texture.from(this._lienzo);
        }

        const ctx = this._lienzo.getContext('2d');
        const piesX = Math.round(ancho / 2), piesY = Math.round(AccionAddition.PIES_Y * this.u);

        ctx.clearRect(0, 0, ancho, alto);
        AccionMotor.pintar(this._accion, this._datos, this._lado, ctx, piesX, piesY, this.u, t);
        this._textura.baseTexture.update();

        sprite.visible = true;
        sprite.texture = this._textura;
        sprite.offsetX = -piesX;
        sprite.offsetY = -piesY;
        sprite.relativeDepth = -0.06;
        sprite.alpha = 255;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        this._escala = scale;
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return false;
    }

    public get id(): number
    {
        return this._id;
    }
}
