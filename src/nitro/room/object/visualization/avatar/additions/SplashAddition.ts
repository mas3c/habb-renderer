import { Texture } from '@pixi/core';
import { IRoomObjectSprite } from '../../../../../../api';
import { SplashMotor } from '../SplashMotor';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * Las partículas del Splash: un lienzo alrededor del keko (de 140 x 190 a escala 1, pies abajo en el centro)
 * por delante de él. Lo repinta AvatarVisualization en cada fotograma mientras dura; luego se quita.
 */
export class SplashAddition implements IAvatarAddition
{
    private static ANCHO = 140;
    private static ALTO = 190;
    private static PIES_Y = 150;

    private _id: number;
    private _efecto: any;
    private _datos: any;
    private _fase: string;
    private _escala = 64;
    private _lienzo: HTMLCanvasElement = null;
    private _textura: Texture = null;

    constructor(id: number, efecto: any, datos: any, fase: string)
    {
        this._id = id;
        this._efecto = efecto;
        this._datos = datos;
        this._fase = fase;
    }

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

        const ancho = Math.round(SplashAddition.ANCHO * this.u), alto = Math.round(SplashAddition.ALTO * this.u);

        if(!this._lienzo || (this._lienzo.width !== ancho))
        {
            if(this._textura) this._textura.destroy(true);

            this._lienzo = document.createElement('canvas');
            this._lienzo.width = ancho;
            this._lienzo.height = alto;
            this._textura = Texture.from(this._lienzo);
        }

        const ctx = this._lienzo.getContext('2d');
        const piesX = Math.round(ancho / 2), piesY = Math.round(SplashAddition.PIES_Y * this.u);

        ctx.clearRect(0, 0, ancho, alto);
        SplashMotor.pintar(this._efecto, this._datos, ctx, piesX, piesY, this.u, t, this._fase);
        this._textura.baseTexture.update();

        sprite.visible = true;
        sprite.texture = this._textura;
        sprite.offsetX = -piesX;
        sprite.offsetY = -piesY;
        sprite.relativeDepth = -0.05;
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
