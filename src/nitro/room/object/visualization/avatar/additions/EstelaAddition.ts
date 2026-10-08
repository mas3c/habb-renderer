import { Texture } from '@pixi/core';
import { IRoomObjectSprite } from '../../../../../../api';
import { AvatarEstela } from '../AvatarEstela';
import { AvatarVisualization } from '../AvatarVisualization';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * La estela al andar en la sala: un sprite con un lienzo alrededor de los pies donde AvatarEstela pinta las
 * partículas que ha ido soltando el avatar. Solo se repinta mientras queda alguna viva: quieto no cuesta nada.
 * Va por detrás del cuerpo y por delante de la sombra.
 */
export class EstelaAddition implements IAvatarAddition
{
    private _id: number;
    private _spec: string;
    private _estela: AvatarEstela;
    private _visualization: AvatarVisualization;
    private _escala = 64;
    private _lienzo: HTMLCanvasElement = null;
    private _textura: Texture = null;

    constructor(id: number, spec: string, visualization: AvatarVisualization)
    {
        this._id = id;
        this._spec = spec;
        this._estela = AvatarEstela.crear(spec);
        this._visualization = visualization;
    }

    public dispose(): void
    {
        this._visualization = null;

        if(this._textura) this._textura.destroy(true);

        this._textura = null;
        this._lienzo = null;
    }

    // lienzo de 5 x 3,4 baldosas con los pies abajo en el centro (las partículas suben hasta ~1 baldosa)
    private get ancho(): number { return Math.round(this._escala * 5); }
    private get alto(): number { return Math.round(this._escala * 3.4); }
    private get piesX(): number { return Math.round(this.ancho / 2); }
    private get piesY(): number { return Math.round(this.alto * 0.62); }

    private preparar(): void
    {
        if(this._lienzo && (this._lienzo.width === this.ancho)) return;

        if(this._textura) this._textura.destroy(true);

        this._lienzo = document.createElement('canvas');
        this._lienzo.width = this.ancho;
        this._lienzo.height = this.alto;
        this._textura = Texture.from(this._lienzo);
    }

    private pintar(sprite: IRoomObjectSprite): boolean
    {
        const objeto = this._visualization?.object;

        if(!this._estela || !objeto) return false;

        const ahora = Date.now();
        const sitio = objeto.getLocation();

        this._estela.paso(sitio.x, sitio.y, sitio.z, ahora);

        if(!this._estela.vivas)
        {
            if(sprite.visible) { sprite.visible = false; return true; }

            return false;
        }

        this.preparar();

        const ctx = this._lienzo.getContext('2d');

        ctx.clearRect(0, 0, this._lienzo.width, this._lienzo.height);
        this._estela.pintar(ctx, this.piesX, this.piesY, sitio.x, sitio.y, sitio.z, ahora, this._escala);
        this._textura.baseTexture.update();

        sprite.visible = true;
        sprite.texture = this._textura;
        // los pies están un cuarto de baldosa por debajo del punto del avatar (donde va su sombra)
        sprite.offsetX = -this.piesX;
        sprite.offsetY = Math.round(this._escala / 4) - this.piesY;
        sprite.relativeDepth = 0.9;
        sprite.alpha = 255;

        return true;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        if(!sprite) return;

        this._escala = scale;
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

    public get spec(): string
    {
        return this._spec;
    }
}
