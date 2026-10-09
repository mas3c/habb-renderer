import { CanvasSource, Texture } from 'pixi.js';
import { IRoomGeometry, IRoomObjectSprite } from '../../../../../../api';
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

    /** la de la sala, para saber dónde cae de verdad el avatar en pantalla (la pone AvatarVisualization) */
    public geometria: IRoomGeometry = null;
    // píxel de pantalla (entero) donde estaba el avatar al pintar el lienzo: el lienzo se queda ahí
    private _anclaX: number = null;
    private _anclaY: number = null;

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
        this._textura = new Texture({ source: new CanvasSource({ resource: this._lienzo }) });
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
        // el avatar cae en pantalla en posiciones con decimales: el lienzo se ancla al píxel entero que queda
        // debajo y las partículas se pintan en esa rejilla fija (ver seguir())
        const pantalla = this.geometria ? this.geometria.getScreenPosition(sitio) : null;
        const fx = pantalla ? (pantalla.x - Math.floor(pantalla.x)) : 0;
        const fy = pantalla ? (pantalla.y - Math.floor(pantalla.y)) : 0;

        this._anclaX = pantalla ? Math.floor(pantalla.x) : null;
        this._anclaY = pantalla ? Math.floor(pantalla.y) : null;

        this._estela.pintar(ctx, (this.piesX + fx), (this.piesY + fy), sitio.x, sitio.y, sitio.z, ahora, this._escala);
        this._textura.source.update();

        sprite.visible = true;
        sprite.texture = this._textura;
        // los pies están un cuarto de baldosa por debajo del punto del avatar (donde va su sombra)
        sprite.offsetX = -this.piesX - fx;
        sprite.offsetY = Math.round(this._escala / 4) - this.piesY - fy;
        sprite.relativeDepth = 0.9;
        sprite.alpha = 255;

        return true;
    }

    /**
     * En cada fotograma. El lienzo se repinta con la animación de la sala (24 por segundo) pero el avatar se
     * desliza por la pantalla en cada fotograma y el sprite va pegado a él: entre repintado y repintado el rastro
     * se iba con el avatar y volvía de golpe (se veía a tirones). Aquí solo se corrige el desfase para que el
     * lienzo se quede donde se pintó, clavado al suelo. Devuelve si ha cambiado algo.
     */
    public seguir(sprite: IRoomObjectSprite, geometria: IRoomGeometry): boolean
    {
        const objeto = this._visualization?.object;

        if(!sprite || !sprite.visible || !objeto || !geometria || (this._anclaX === null)) return false;

        const pantalla = geometria.getScreenPosition(objeto.getLocation());

        if(!pantalla) return false;

        const offsetX = (this._anclaX - this.piesX - pantalla.x);
        const offsetY = (this._anclaY + Math.round(this._escala / 4) - this.piesY - pantalla.y);

        if((offsetX === sprite.offsetX) && (offsetY === sprite.offsetY)) return false;

        sprite.offsetX = offsetX;
        sprite.offsetY = offsetY;

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
