import { BaseTexture, Resource, Texture } from '@pixi/core';
import { AvatarAction, IRoomObjectSprite, NitroConfiguration } from '../../../../../../api';
import { AvatarVisualization } from '../AvatarVisualization';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * El globo de pensamiento «está jugando» (UNO, Parchís, SnowStorm, BattleBall...) encima del avatar.
 *
 * El servidor manda en el estado del avatar («jg <classname>») el furni del hotel cuyo icono va dentro; el globo
 * se pinta aquí píxel a píxel con la paleta de la captura de referencia (contorno, brillo y relleno gris azulado)
 * y la pompa pequeña abajo a la izquierda. Una textura por icono y tamaño, compartida por toda la sala.
 *
 * Habbo tiene `figure_is_playing_game`, pero no viaja por ningún paquete: el AIR solo lo pone dentro de la
 * arena del SnowStorm y sirve para agrandar la zona de clic (GameClickTargetAddition), no pinta nada.
 */
const CONTORNO = [ 0x4b, 0x5e, 0x66 ], BRILLO = [ 0xe8, 0xe8, 0xe8 ], CANTO = [ 0xd3, 0xd6, 0xd8 ], RELLENO = [ 0xbf, 0xc6, 0xc9 ];

type Texturas = { grande: Texture<Resource>, pequena: Texture<Resource> };

export class JugandoAddition implements IAvatarAddition
{
    private static _texturas = new Map<string, Texturas>();

    private _id: number;
    private _icono: string;
    private _visualization: AvatarVisualization;
    private _relativeDepth = 0;
    private _pequena = false;
    private _base = -83;
    private _pintado: Texture<Resource> = null;

    constructor(id: number, icono: string, visualization: AvatarVisualization)
    {
        this._id = id;
        this._icono = icono;
        this._visualization = visualization;

        JugandoAddition.cargar(icono);
    }

    private static cargar(icono: string): void
    {
        if(JugandoAddition._texturas.has(icono)) return;

        JugandoAddition._texturas.set(icono, null);

        const img = new Image();

        img.crossOrigin = 'anonymous';
        img.onload = () => JugandoAddition._texturas.set(icono, { grande: JugandoAddition.globo(img, false), pequena: JugandoAddition.globo(img, true) });
        img.src = NitroConfiguration.getValue<string>('furni.asset.icon.url', '').replace(/%libname%/gi, icono).replace(/%param%/gi, '');
    }

    /** Recorte del icono sin el margen transparente: [x, y, ancho, alto]. */
    private static recorte(img: HTMLImageElement): number[]
    {
        const c = document.createElement('canvas');

        c.width = img.width;
        c.height = img.height;

        const ctx = c.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;

        for(let y = 0; y < c.height; y++) for(let x = 0; x < c.width; x++)
        {
            if(d[((y * c.width) + x) * 4 + 3] < 8) continue;

            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }

        return (x1 < 0) ? [ 0, 0, img.width, img.height ] : [ x0, y0, (x1 - x0 + 1), (y1 - y0 + 1) ];
    }

    /** Un círculo de pixel art: contorno de 1 px, brillo más grueso arriba a la izquierda (la luz de Habbo), canto y relleno. */
    private static circulo(d: Uint8ClampedArray, ancho: number, cx: number, cy: number, r: number): void
    {
        for(let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for(let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        {
            const dx = (x + 0.5 - cx), dy = (y + 0.5 - cy);
            const dist = Math.sqrt((dx * dx) + (dy * dy));

            if(dist > r) continue;

            // la luz viene de arriba a la izquierda: allí el brillo es más ancho
            const luz = Math.max(0, -(dx + dy) / (r * 1.41));
            const rim = (r - dist);
            const color = (rim < 1) ? CONTORNO : (rim < (2 + luz)) ? BRILLO : (rim < (3 + luz)) ? CANTO : RELLENO;
            const i = ((y * ancho) + x) * 4;

            d[i] = color[0]; d[i + 1] = color[1]; d[i + 2] = color[2]; d[i + 3] = 255;
        }
    }

    private static globo(img: HTMLImageElement, pequena: boolean): Texture<Resource>
    {
        const [ ix, iy, iw, ih ] = JugandoAddition.recorte(img);
        const div = pequena ? 2 : 1;
        const w = Math.round(iw / div), h = Math.round(ih / div);
        // el icono cabe en el círculo con aire alrededor (como en la captura); la pompa pequeña sale por abajo a la izquierda
        const r = Math.ceil((Math.sqrt((w * w) + (h * h)) / 2) + (pequena ? 2 : 3));
        const rp = pequena ? 2.5 : 5;
        const ancho = (r * 2) + 2, alto = (r * 2) + Math.ceil(rp) + 2;
        const lienzo = document.createElement('canvas');

        lienzo.width = ancho;
        lienzo.height = alto;

        const ctx = lienzo.getContext('2d');
        const datos = ctx.createImageData(ancho, alto);
        const cx = r + 1, cy = r + 1;

        JugandoAddition.circulo(datos.data, ancho, cx - (r * 0.62), cy + (r * 0.78), rp);
        JugandoAddition.circulo(datos.data, ancho, cx, cy, r);
        ctx.putImageData(datos, 0, 0);
        ctx.imageSmoothingEnabled = pequena;
        ctx.drawImage(img, ix, iy, iw, ih, Math.round(cx - (w / 2)), Math.round(cy - (h / 2)), w, h);

        return new Texture(BaseTexture.from(lienzo));
    }

    public dispose(): void
    {
        // las texturas son de toda la sala: no se destruyen
        this._visualization = null;
        this._pintado = null;
    }

    private pintar(sprite: IRoomObjectSprite): boolean
    {
        const texturas = JugandoAddition._texturas.get(this._icono);
        const textura = texturas ? (this._pequena ? texturas.pequena : texturas.grande) : null;
        // si en su sitio hay otra burbuja (escribiendo, Habbicon, número), esa manda mientras dura
        const visible = !!textura && !this._visualization.cabezaOcupada && !this._visualization.escribiendo;
        // encima de la placa VIP o de lo que pinte el efecto sobre la cabeza, si lo hay
        const cima = Math.min(this._visualization.cimaVip || 0, this._visualization.cimaEfecto || 0);
        const abajo = cima ? Math.min(this._base, cima - (this._pequena ? 1 : 2)) : this._base;
        const offsetY = visible ? (abajo - textura.height) : 0;

        if((sprite.visible === visible) && (this._pintado === textura) && (sprite.offsetY === offsetY)) return false;

        sprite.visible = visible;
        this._pintado = textura;

        if(!visible) return true;

        sprite.texture = textura;
        sprite.offsetX = -Math.floor(textura.width / 2) + (this._pequena ? 1 : 2);
        sprite.offsetY = offsetY;

        return true;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        if(!sprite) return;

        this._pequena = (scale < 48);

        let base = this._pequena ? -40 : -80;

        if(this._visualization.posture === AvatarAction.POSTURE_SIT) base += (this._pequena ? 16 : 32);
        else if(this._visualization.posture === AvatarAction.POSTURE_LAY) base += scale;

        this._base = base;
        this._pintado = null;
        sprite.alpha = 255;
        sprite.relativeDepth = -0.02;
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

    public get icono(): string
    {
        return this._icono;
    }

    public get relativeDepth(): number
    {
        return this._relativeDepth;
    }

    public set relativeDepth(depth: number)
    {
        this._relativeDepth = depth;
    }
}
