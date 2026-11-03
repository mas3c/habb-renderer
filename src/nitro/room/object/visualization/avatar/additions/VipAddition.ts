import { BaseTexture, Resource, Texture } from '@pixi/core';
import { Rectangle } from '@pixi/math';
import { AvatarAction, IRoomObjectSprite } from '../../../../../../api';
import { AvatarVisualization } from '../AvatarVisualization';
import { IAvatarAddition } from './IAvatarAddition';

// La placa «VIP» del monedero (habblive-vip-icon.png del cliente, 26x13), incrustada para no depender de rutas.
const PLACA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAANCAMAAACAR47fAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExURQAAAHd3d1ZWVtPT0+rq6lJSUmhoaGNjY1dXV4KCgmxsbH19fXFxcQAAAEB7zJAAAAAOdFJOU/////////////////8ARcDcyAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS4xMhMBR3QAAAC4ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAIAAAAxAQIAEQAAAFoAAABphwQAAQAAAGwAAAAAAAAAYAAAAAEAAABgAAAAAQAAAFBhaW50Lk5FVCA1LjEuMTIAAAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACWAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAANmnmpXJtwtfAAAAi0lEQVQoU02QARLDIAgEQYgxUP7/3R6gTR3hkMUbR4oIIvqPlFzIxDxoMBMPBBKOjbI7qnEEu8yARJVVZHQopO4ByTUvRWy91730oPlM3YHa1Hxpo9N+EXSj5TW5b/vHUReCo+FoepDN8mu0/IF9ojQUKZIoLXPw98r3N5IJzCtX1WsP1GDm84ER8QXs8ghBztoNMAAAAABJRU5ErkJggg==';

// Una sola animación para toda la sala: 72 fotogramas (3 s a 24 fps) pintados UNA vez en una hoja
// compartida. Cada fotograma ya lleva el flotar (0-3 px) y el brillo que cruza la placa, así que
// el sprite no cambia de posición (el nombre al pasar el ratón no baila) y los avatares solo
// cambian de recorte de textura. Todos van a la vez porque el fotograma sale del reloj.
const FOTOGRAMAS = 72, CICLO_MS = 3000, MARGEN = 3, FLOTA = 3;
const ANCHO = 26 + (MARGEN * 2), ALTO = 13 + FLOTA + (MARGEN * 2);
// fila de la sala alejada: la placa a la mitad (13x7), con su propio flotar de 0-1 px
const ANCHO_P = 13 + (MARGEN * 2), ALTO_P = 7 + 1 + (MARGEN * 2);

export class VipAddition implements IAvatarAddition
{
    private static _cargando = false;
    private static _grandes: Texture<Resource>[] = null;
    private static _pequenas: Texture<Resource>[] = null;

    private _id: number;
    private _hasta: number;
    private _visualization: AvatarVisualization;
    private _pequena = false;
    private _ultimo = -2;
    private _base = -83; // borde de abajo de la placa por la postura (sin efecto encima)
    private _alto = ALTO;

    constructor(id: number, hasta: number, visualization: AvatarVisualization)
    {
        this._id = id;
        this._hasta = hasta;
        this._visualization = visualization;

        VipAddition.cargar();
    }

    private static cargar(): void
    {
        if(VipAddition._cargando) return;

        VipAddition._cargando = true;

        const img = new Image();

        img.onload = () => VipAddition.hoja(img);
        img.src = PLACA;
    }

    /** Pinta los fotogramas grandes (fila 0) y pequeños (fila 1) en un solo lienzo: una textura en la GPU para todo el hotel. */
    private static hoja(img: HTMLImageElement): void
    {
        const lienzo = document.createElement('canvas');
        lienzo.width = FOTOGRAMAS * ANCHO;
        lienzo.height = ALTO + ALTO_P;

        const ctx = lienzo.getContext('2d');
        const placa = document.createElement('canvas');
        const pc = placa.getContext('2d');

        const pintar = (i: number, x0: number, y0: number, w: number, h: number, flota: number) =>
        {
            const fase = i / FOTOGRAMAS;
            // arriba y abajo una vez por ciclo, suave (coseno), en píxeles enteros
            const y = y0 + MARGEN + Math.round((flota / 2) * (1 + Math.cos(fase * Math.PI * 2)));

            // la placa sola, con el brillo dentro de su silueta
            placa.width = w;
            placa.height = h;
            pc.imageSmoothingEnabled = (w !== img.width);
            pc.drawImage(img, 0, 0, w, h);

            // el brillo: una franja diagonal que cruza la placa entre el 55 % y el 85 % del ciclo
            const brillo = (fase - 0.55) / 0.30;

            if((brillo > 0) && (brillo < 1))
            {
                const cx = -6 + (brillo * (w + 12));
                const g = pc.createLinearGradient(cx - 3, 0, cx + 3, h);

                g.addColorStop(0, 'rgba(255, 255, 255, 0)');
                g.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
                g.addColorStop(1, 'rgba(255, 255, 255, 0)');
                pc.globalCompositeOperation = 'source-atop';
                pc.fillStyle = g;
                pc.fillRect(0, 0, w, h);
                pc.globalCompositeOperation = 'source-over';
            }

            // sombra suave debajo para que se lea sobre cualquier suelo o pared
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetY = 1;
            ctx.drawImage(placa, x0 + MARGEN, y);
            ctx.restore();
        };

        for(let i = 0; i < FOTOGRAMAS; i++)
        {
            pintar(i, i * ANCHO, 0, img.width, img.height, FLOTA);
            pintar(i, i * ANCHO, ALTO, Math.round(img.width / 2), Math.round(img.height / 2), 1);
        }

        const base = BaseTexture.from(lienzo);
        const grandes: Texture<Resource>[] = [];
        const pequenas: Texture<Resource>[] = [];

        for(let i = 0; i < FOTOGRAMAS; i++)
        {
            grandes.push(new Texture(base, new Rectangle(i * ANCHO, 0, ANCHO, ALTO)));
            pequenas.push(new Texture(base, new Rectangle(i * ANCHO, ALTO, ANCHO_P, ALTO_P)));
        }

        VipAddition._grandes = grandes;
        VipAddition._pequenas = pequenas;
    }

    public dispose(): void
    {
        // la hoja es de todos: no se destruye
        this._visualization = null;
    }

    private pintar(sprite: IRoomObjectSprite): boolean
    {
        const texturas = this._pequena ? VipAddition._pequenas : VipAddition._grandes;
        const visible = !!texturas && (Date.now() < this._hasta) && !this._visualization.cabezaOcupada;
        const fotograma = visible ? (Math.floor(Date.now() / (CICLO_MS / FOTOGRAMAS)) % FOTOGRAMAS) : -1;

        // apilada: si el efecto activo pinta algo sobre la cabeza (la placa del enable de staff...), justo encima
        const cima = this._visualization.cimaEfecto;
        const abajo = cima ? Math.min(this._base, cima - (this._pequena ? 1 : 2)) : this._base;
        const offsetY = abajo - this._alto + MARGEN;

        // con el nombre o el menú del avatar en pantalla (van justo ahí) la placa se vuelve transparente pero sigue «visible»,
        // así el recuadro del avatar no cambia y el nombre (o el menú) no salta
        const alpha = this._visualization.resaltado ? 0 : 255;

        if((fotograma === this._ultimo) && (sprite.offsetY === offsetY) && (sprite.alpha === alpha)) return false;

        this._ultimo = fotograma;
        sprite.visible = visible;
        sprite.offsetY = offsetY;
        sprite.alpha = alpha;

        if(visible) sprite.texture = texturas[fotograma];

        return true;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        if(!sprite) return;

        this._pequena = (scale < 48);
        this._ultimo = -2;

        // la parte de abajo de la placa (en lo más bajo del flotar) unos píxeles por encima del pelo
        let base = this._pequena ? -42 : -83;

        if(this._visualization.posture === AvatarAction.POSTURE_SIT) base += (this._pequena ? 16 : 32);
        else if(this._visualization.posture === AvatarAction.POSTURE_LAY) base += scale;

        this._base = base;
        this._alto = this._pequena ? ALTO_P : ALTO;
        sprite.offsetX = -Math.floor((this._pequena ? ANCHO_P : ANCHO) / 2);
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

    public get hasta(): number
    {
        return this._hasta;
    }
}
