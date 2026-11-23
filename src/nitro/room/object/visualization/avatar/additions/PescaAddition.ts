import { SCALE_MODES } from '@pixi/constants';
import { Resource, Texture } from '@pixi/core';
import { AlphaTolerance, AvatarAction, GetAssetManager, IRoomObjectSprite, IVector3D, NitroConfiguration } from '../../../../../../api';
import { IAvatarAddition } from './IAvatarAddition';

/**
 * La pesca en el avatar: la caña en la mano, el sedal, el flotador, el pez que sale del agua y cuelga, y las chispas de
 * la captura perfecta. Es el renderer del ORIGINAL portado 1:1 (nitro-renderer-f6ca4ae4.js, bloque de pesca: pJ/SJ,
 * RJ, yJ, qJ, XJ, QR, $r, GJ, Nu y $J), con sus mismas constantes y tiempos; solo cambian los nombres y los tipos.
 *
 * - La caña y los flotadores y peces son sprites de la librería «fishing» (fishing.nitro original): h_ (escala 64) y
 *   sh_ (escala 32), 8 direcciones, una variante por skin con la base de respaldo.
 * - El sedal se pinta en un lienzo con segmentos de 1 px (Bresenham) del color de la skin.
 * - El flotador en reposo sube y baja 1 px cada 167 ms.
 * - Captura (qJ): el pez sube del agua a la punta en 700 ms por una curva cuadrática con easing; cuelga oscilando
 *   1700 ms; se desvanece en 210 ms; y en los 390 ms que quedan de la etapa de 600 ms se vuelve a lanzar (3000 ms en
 *   total). Con «last» no se relanza. Escape (XJ): 700 ms de transición del sedal y el flotador.
 * Todo cuelga del estado «fsh» del avatar (lo manda el servidor), así que lo ve igual toda la sala.
 */

/** Lo que las adiciones leen de la visualización del avatar (AvatarVisualization lo implementa). */
export interface IPescaVisualizacion
{
    readonly bodyDirection: number;
    readonly posture: string;
    readonly layerAlpha: number;
    readonly fishingSkin: string;
    readonly fishingTarget: string;
    readonly fishingCatch: PescaCaptura;
    readonly fishingCatchElapsed: number;
    readonly fishingTime: number;
    getScreenOffsetTo(x: number, y: number, z: number): IVector3D;
}

export interface PescaCaptura { code: string, perfect: boolean, last: boolean, kind: 'caught' | 'escaped' }

interface Punto { x: number, y: number }

// ------------------------------------------------------------------ librería «fishing»

let pedida = false;

/** Pide fishing.nitro una vez (renderer-config «fishing.library.url»; si no, junto a los efectos). */
export const cargarLibreriaPesca = (): void =>
{
    if(pedida || GetAssetManager()?.getCollection('fishing')) return;

    pedida = true;

    const url = NitroConfiguration.getValue<string>('fishing.library.url', '') || NitroConfiguration.interpolate('${asset.url}/bundled/generic/fishing.nitro');

    GetAssetManager().downloadAsset(url).catch(() => (pedida = false));
};

// ------------------------------------------------------------------ constantes y ayudas del original

const COLOR_SEDAL = 5263440; // IJ
const SEPARACION = 0.1; // TJ

/** Jc: el punto del agua, 2 px (sh) o 4 px (h) más arriba. */
const puntoAgua = (p: Punto, escala: number): Punto => ({ x: p.x, y: p.y - (escala < 48 ? 2 : 4) });

/** $c */
const profundidadAgua = (r: number, z: number): number => Math.min(r, z - SEPARACION);

/** RJ: línea de Bresenham, píxel a píxel. */
const lineaPixeles = (x0: number, y0: number, x1: number, y1: number): [ number, number ][] =>
{
    const puntos: [ number, number ][] = [];
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
    let err = dx + dy;

    for(;;)
    {
        puntos.push([ x0, y0 ]);

        if((x0 === x1) && (y0 === y1)) break;

        const e2 = 2 * err;

        if(e2 >= dy) { err += dy; x0 += sx; }
        if(e2 <= dx) { err += dx; y0 += sy; }
    }

    return puntos;
};

/** pJ: desplazamiento base de la caña por tamaño. */
const BASE: Record<string, [ number, number ]> = { h: [ 1, 8 ], sh: [ 1, -1 ] };

/** SJ: la punta de la caña por tamaño y dirección (0-7), desde la base. */
const PUNTA: Record<string, [ number, number ][]> = {
    h: [ [ 32, -87 ], [ 26, -84 ], [ 14, -79 ], [ -5, -90 ], [ -34, -85 ], [ -26, -87 ], [ -15, -97 ], [ 12, -93 ] ],
    sh: [ [ 19, -37 ], [ 17, -37 ], [ 10, -33 ], [ -6, -36 ], [ -20, -37 ], [ -20, -37 ], [ -11, -41 ], [ 1, -43 ] ]
};

const nombreCana = (tam: string, dir: number, skin: string): string => (skin ? `${ tam }_fishing_rod_${ skin }_${ dir }` : `${ tam }_fishing_rod_${ dir }`);

const dir8 = (d: number): number => (((Math.trunc(d) || 0) % 8) + 8) % 8;

/** td: textura, desplazamiento y punta de la caña para esa dirección y escala (la de la skin o la base). */
const cana = (direccion: number, escala: number, skin = ''): { texture: Texture<Resource>, offsetX: number, offsetY: number, tipX: number, tipY: number } =>
{
    const tam = (escala < 48) ? 'sh' : 'h';
    const d = dir8(direccion);
    const coleccion = GetAssetManager()?.getCollection('fishing');
    const asset = (skin ? coleccion?.getAsset(nombreCana(tam, d, skin)) : null) || coleccion?.getAsset(nombreCana(tam, d, ''));

    if(!asset) return null;

    const [ bx, by ] = BASE[tam];
    const [ px, py ] = PUNTA[tam][d];

    return { texture: asset.texture, offsetX: bx + asset.offsetX, offsetY: by + asset.offsetY, tipX: bx + px, tipY: by + py };
};

/** rg + th: textura del flotador (de la skin o el base) o del pez. */
const textura = (tipo: 'fish' | 'bobber', codigo: string, escala: number, skin = ''): Texture<Resource> =>
{
    const tam = (escala < 48) ? 'sh' : 'h';
    const nombre = (s: string) => `${ tam }_${ (tipo === 'fish') ? `fishing_fish_${ codigo }` : (s ? `fishing_bobber_${ s }` : 'fishing_bobber') }`;
    const coleccion = GetAssetManager()?.getCollection('fishing');
    const asset = ((tipo === 'bobber') && skin ? coleccion?.getAsset(nombre(skin)) : null) || coleccion?.getAsset(nombre(''));

    return asset?.texture || null;
};

/** QR: color del sedal y chispas de cada skin. */
const SKINS: Record<string, { lineColor: number, sparkle: { pattern: string[], colors: Record<string, string> } }> = {
    lacito: { lineColor: 16744376, sparkle: { pattern: [ '.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..' ], colors: { R: '#ff4f9a' } } },
    gotica: { lineColor: 16727972, sparkle: { pattern: [ 'K.....K', 'KK.K.KK', '.KKKKK.', '..K.K..' ], colors: { K: '#b040ff' } } },
    ninja: { lineColor: 3778815, sparkle: { pattern: [ '...S...', '...S...', '..SKS..', 'SSK.KSS', '..SKS..', '...S...', '...S...' ], colors: { S: '#dfe8f2', K: '#39a8ff' } } },
    camuflaje: { lineColor: 7043642, sparkle: { pattern: [ '...R...', '...R...', '.......', 'RR.R.RR', '.......', '...R...', '...R...' ], colors: { R: '#ff3030' } } }
};

const PASO_FLOTADOR = 167; // OJ
const colorSedal = (skin: string): number => SKINS[skin]?.lineColor ?? COLOR_SEDAL; // AJ
const chispasSkin = (skin: string) => SKINS[skin]?.sparkle ?? null; // CJ
/** MJ: el flotador en reposo lo pinta el avatar solo esperando (fase 1) y con skin; sin skin es el del propio furni de
 *  agua (su estado 2, el corcho). */
export const conFlotadorEnReposo = (fase: number, skin: string): boolean => (fase === 1) && !!skin;
/** yJ: el flotador sube y baja 1 px cada 167 ms. */
const vaiven = (t: number): number => ((Math.floor(t / PASO_FLOTADOR) % 2) ? 1 : 0);

/** xa: «x,y,z» → punto, o null. */
export const destinoPesca = (texto: string): { x: number, y: number, z: number } =>
{
    const [ x, y, z ] = (texto || '').split(';')[0].split(',').map(v => parseFloat(v));

    return [ x, y, z ].every(Number.isFinite) ? { x, y, z } : null;
};

// ------------------------------------------------------------------ el estado «fsh» (lo que lee RoomMessageHandler)

/** NJ: fase del estado (1 esperando, 2 picada, 3 capturado, 4 escapado). */
export const fasePesca = (valor: string): number =>
{
    switch((valor || '').split(';')[0].split(',')[3])
    {
        case '1': return 2;
        case '2': return 3;
        case '3': return 4;
        default: return 1;
    }
};

/** FJ (sin el paso por las acciones): «destino|captura|skin» del valor del estado «x,y,z[,fase,...];skin». */
export const datosPesca = (valor: string): string =>
{
    const [ datos = '', skin = '' ] = (valor || '').split(';');
    const p = destinoPesca(datos);
    const t = datos.split(',');
    const captura = (t[3] === '2') ? `${ t[4] || '0' },${ t[5] || '0' },${ t[6] || '0' }` : ((t[3] === '3') ? `,0,${ t[4] || '0' }` : '');

    return `${ p ? `${ p.x },${ p.y },${ p.z }` : '' }|${ captura }|${ skin }`;
};

/** xJ */
export const partirDatosPesca = (texto: string): { target: string, fishCatch: string, skin: string } =>
{
    const [ target = '', fishCatch = '', skin = '' ] = (texto || '').split('|');

    return { target, fishCatch, skin };
};

/** bJ */
export const leerCaptura = (texto: string): { code: string, perfect: boolean, last: boolean } =>
{
    if(!texto) return null;

    const [ code, perfect, last ] = texto.split(',');

    return { code: code || '', perfect: perfect === '1', last: last === '1' };
};

// ------------------------------------------------------------------ la caña ($r)

export class CanaPescaAddition implements IAvatarAddition
{
    public static AVATAR_DEPTH = -0.01;
    public static AVATAR_LAYING_DEPTH = -0.409;
    public static DEPTH_GAP = 0.005;

    private _id: number;
    private _vis: IPescaVisualizacion;
    private _escala = 64;

    constructor(id: number, vis: IPescaVisualizacion)
    {
        this._id = id;
        this._vis = vis;
    }

    public dispose(): void { this._vis = null; }

    public update(sprite: IRoomObjectSprite, escala: number): void
    {
        if(!sprite) return;

        this._escala = escala;
        this.render(sprite, true);
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return sprite ? this.render(sprite, false) : false;
    }

    private render(sprite: IRoomObjectSprite, forzar: boolean): boolean
    {
        if(!this._vis) return false;

        const dir = this._vis.bodyDirection;
        const c = cana(dir, this._escala, this._vis.fishingSkin);

        if(!c) { sprite.visible = false; return false; }

        const alfa = this._vis.layerAlpha & 255;

        if(!forzar && (sprite.texture === c.texture) && (sprite.alpha === alfa) && sprite.visible) return false;

        const postura = this._vis.posture;

        sprite.visible = true;
        sprite.alpha = alfa;
        sprite.texture = c.texture;
        sprite.offsetX = c.offsetX;
        sprite.offsetY = c.offsetY + CanaPescaAddition.desplazamientoPostura(postura, this._escala);
        sprite.relativeDepth = CanaPescaAddition.profundidad(dir, postura);

        return true;
    }

    /** Sentado o tumbado, la caña baja media escala. */
    public static desplazamientoPostura(postura: string, escala: number): number
    {
        return ((postura === AvatarAction.POSTURE_LAY) || (postura === AvatarAction.POSTURE_SIT)) ? (escala / 2) : 0;
    }

    /** Delante o detrás del avatar según hacia dónde mira (0, 6 y 7: detrás). */
    public static profundidad(direccion: number, postura: string): number
    {
        const base = (postura === AvatarAction.POSTURE_LAY) ? CanaPescaAddition.AVATAR_LAYING_DEPTH : CanaPescaAddition.AVATAR_DEPTH;

        return CanaPescaAddition.detras(direccion) ? (base + CanaPescaAddition.DEPTH_GAP) : (base - CanaPescaAddition.DEPTH_GAP);
    }

    public static detras(direccion: number): boolean
    {
        const d = dir8(direccion);

        return (d === 0) || (d === 6) || (d === 7);
    }

    public get id(): number { return this._id; }
}

// ------------------------------------------------------------------ el flotador en reposo (GJ)

export class CorchoPescaAddition implements IAvatarAddition
{
    private static DEPTH_GAP = 0.001;

    private _id: number;
    private _vis: IPescaVisualizacion;
    private _escala = 64;

    constructor(id: number, vis: IPescaVisualizacion)
    {
        this._id = id;
        this._vis = vis;
    }

    public dispose(): void { this._vis = null; }

    public update(sprite: IRoomObjectSprite, escala: number): void
    {
        if(!sprite) return;

        this._escala = escala;
        this.render(sprite, true);
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return sprite ? this.render(sprite, false) : false;
    }

    private render(sprite: IRoomObjectSprite, forzar: boolean): boolean
    {
        const v = this._vis;

        if(!v) return false;

        const tex = textura('bobber', '', this._escala, v.fishingSkin);
        const destino = destinoPesca(v.fishingTarget);
        const agua = destino ? v.getScreenOffsetTo(destino.x, destino.y, destino.z) : null;

        if(!tex || !agua)
        {
            const antes = sprite.visible;

            sprite.visible = false;

            return antes;
        }

        const p = puntoAgua(agua, this._escala);
        const ox = p.x - Math.round(tex.width / 2);
        const oy = p.y + vaiven(v.fishingTime);
        const alfa = v.layerAlpha & 255;
        const prof = profundidadAgua(CanaPescaAddition.profundidad(v.bodyDirection, v.posture), agua.z) - CorchoPescaAddition.DEPTH_GAP;

        if(!forzar && sprite.visible && (sprite.texture === tex) && (sprite.offsetX === ox) && (sprite.offsetY === oy) && (sprite.alpha === alfa) && (sprite.relativeDepth === prof)) return false;

        sprite.visible = true;
        sprite.alpha = alfa;
        sprite.texture = tex;
        sprite.offsetX = ox;
        sprite.offsetY = oy;
        sprite.relativeDepth = prof;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;

        return true;
    }

    public get id(): number { return this._id; }
}

// ------------------------------------------------------------------ el resultado: captura y escape (qJ, XJ)

const SACAR_MS = 700; // so
const COLGADO_MS = 1700; // BJ
const ETAPA_MS = 600; // $R
const ESCAPE_MS = 700; // HJ
const DESVANECER_MS = 210; // Sl
const RELANZAR_MS = ETAPA_MS - DESVANECER_MS; // VJ
const OSCILA_MS = 900; // wJ
const CHISPA_MS = 140; // kJ
const CHISPA_TAMANOS = [ 2, 1, 0, 1 ]; // WJ
const CHISPA_DESFASE = [ 0, 2, 1 ]; // jJ
const TEMBLOR_MS = 60; // YJ
const TEMBLOR_HASTA = 0.85; // zJ
const SEGMENTOS = 17; // ng

/** KJ: easing cúbico de entrada y salida. */
const suave = (t: number): number => ((t < 0.5) ? (4 * t * t * t) : (1 - (Math.pow((-2 * t) + 2, 3) / 2)));

const recta = (a: Punto, b: Punto): Punto[] => [ { x: a.x, y: a.y }, { x: b.x, y: b.y } ];

interface Resultado { fish: { x: number, y: number, alpha: number }, line: Punto[], bobber: Punto, sparkles: { x: number, y: number, size: number }[] }

interface Entrada { kind: 'caught' | 'escaped', elapsed: number, perfect: boolean, last: boolean, tip: Punto, water: Punto, scale: number, fishWidth: number, fishHeight: number }

/** XJ: escape. El sedal ondula y el flotador da un saltito mientras vuelve. */
const escape = (r: Entrada, k: number): Resultado =>
{
    const { tip, water } = r;
    const i = Math.min(1, r.elapsed / ESCAPE_MS);

    if(i >= 1) return { fish: null, line: recta(tip, water), bobber: { x: water.x, y: water.y }, sparkles: [] };

    const linea: Punto[] = [];

    for(let a = 0; a < SEGMENTOS; a++)
    {
        const o = a / (SEGMENTOS - 1);

        linea.push({ x: Math.round(tip.x + ((water.x - tip.x) * o)), y: Math.round(tip.y + ((water.y - tip.y) * o) + (Math.sin(Math.PI * o) * 10 * k * (1 - i))) });
    }

    return { fish: null, line: linea, bobber: { x: water.x, y: water.y - Math.round(Math.sin(Math.PI * i) * 3 * k) }, sparkles: [] };
};

/** qJ: dónde están el pez, el sedal, el flotador y las chispas en cada momento del resultado. */
const resultado = (r: Entrada): Resultado =>
{
    const k = r.scale / 64;
    const { tip, water } = r;
    const t = Math.max(0, r.elapsed);

    if(r.kind === 'escaped') return escape({ ...r, elapsed: t }, k);

    const lado = Math.sign(water.x - tip.x) || 1;
    const colgado = { x: tip.x + (6 * k * lado), y: tip.y + (18 * k) };
    const finColgado = SACAR_MS + COLGADO_MS;
    const finEtapa = finColgado + ETAPA_MS;
    const finDesvanecer = finColgado + DESVANECER_MS;

    if(t < SACAR_MS)
    {
        const f = t / SACAR_MS;
        const m = suave(f);
        const cx = ((water.x + colgado.x) / 2) + (14 * k * lado);
        const cy = Math.min(water.y, colgado.y) - (22 * k);
        const tiembla = (f < TEMBLOR_HASTA) ? (((Math.floor(t / TEMBLOR_MS) % 2) === 0) ? -1 : 1) : 0;
        const p = {
            x: Math.round(((1 - m) * (1 - m) * water.x) + (2 * (1 - m) * m * cx) + (m * m * colgado.x) + tiembla),
            y: Math.round(((1 - m) * (1 - m) * water.y) + (2 * (1 - m) * m * cy) + (m * m * colgado.y))
        };

        return { fish: { x: p.x, y: p.y, alpha: 1 }, line: recta(tip, p), bobber: null, sparkles: [] };
    }

    const c = t - SACAR_MS;
    const oscila = { x: Math.round(colgado.x + (Math.sin((c / OSCILA_MS) * 2 * Math.PI) * 3 * k)), y: Math.round(colgado.y) };

    if(t < finColgado)
    {
        const chispas: Resultado['sparkles'] = [];

        if(r.perfect)
        {
            const { x, y } = oscila;
            const w = r.fishWidth, h = r.fishHeight;

            [ { x: x - (w / 2) - (5 * k), y: y + (h / 6) }, { x: x + (w / 2) + (4 * k), y: y + (h / 2) }, { x: x - (2 * k), y: y + h + (4 * k) } ]
                .forEach((p, i) => chispas.push({ x: Math.round(p.x), y: Math.round(p.y), size: CHISPA_TAMANOS[(Math.floor(c / CHISPA_MS) + CHISPA_DESFASE[i]) % 4] }));
        }

        return { fish: { x: oscila.x, y: oscila.y, alpha: 1 }, line: recta(tip, oscila), bobber: null, sparkles: chispas };
    }

    if(t < finDesvanecer)
    {
        const p = { x: Math.round(colgado.x), y: Math.round(colgado.y) };

        return { fish: { x: p.x, y: p.y, alpha: 1 - ((t - finColgado) / DESVANECER_MS) }, line: recta(tip, p), bobber: null, sparkles: [] };
    }

    if(r.last) return { fish: null, line: recta(tip, colgado), bobber: null, sparkles: [] };

    if(t < finEtapa)
    {
        const f = (t - finDesvanecer) / RELANZAR_MS;
        const m = 1 - Math.pow(1 - f, 3);
        const p = { x: Math.round(tip.x + ((water.x - tip.x) * m)), y: Math.round(tip.y + ((water.y - tip.y) * m)) - Math.round(Math.sin(Math.PI * m) * 16 * k) };

        return { fish: null, line: recta(tip, p), bobber: p, sparkles: [] };
    }

    return { fish: null, line: recta(tip, water), bobber: { x: water.x, y: water.y }, sparkles: [] };
};

/** tp: el resultado para la visualización (null si no hay captura ni escape). */
const resultadoDe = (v: IPescaVisualizacion, escala: number): Resultado =>
{
    const captura = v ? v.fishingCatch : null;

    if(!captura) return null;

    const c = cana(v.bodyDirection, escala);
    const destino = destinoPesca(v.fishingTarget);
    const agua = destino ? v.getScreenOffsetTo(destino.x, destino.y, destino.z) : null;

    if(!c || !agua) return null;

    const pez = textura('fish', captura.code, escala);

    return resultado({
        kind: captura.kind, elapsed: v.fishingCatchElapsed, perfect: captura.perfect, last: captura.last,
        tip: { x: c.tipX, y: c.tipY + CanaPescaAddition.desplazamientoPostura(v.posture, escala) },
        water: puntoAgua(agua, escala), scale: escala, fishWidth: pez ? pez.width : 0, fishHeight: pez ? pez.height : 0
    });
};

const BLANCO = '#ffffff', AMARILLO = '#fff3a6', DORADO = '#ffcc33'; // QJ, ZJ, JJ

/** Nu: el pez, el flotador o las chispas del resultado (una adición por parte). */
export class CapturaPescaAddition implements IAvatarAddition
{
    private _id: number;
    private _vis: IPescaVisualizacion;
    private _parte: 'fish' | 'bobber' | 'sparkles';
    private _escala = 64;
    private _textura: Texture<Resource> = null;
    private _clave = '';

    constructor(id: number, vis: IPescaVisualizacion, parte: 'fish' | 'bobber' | 'sparkles')
    {
        this._id = id;
        this._vis = vis;
        this._parte = parte;
    }

    public dispose(): void
    {
        if(this._textura) this._textura.destroy(true);

        this._textura = null;
        this._vis = null;
    }

    public update(sprite: IRoomObjectSprite, escala: number): void
    {
        if(!sprite) return;

        this._escala = escala;
        this.render(sprite, true);
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return sprite ? this.render(sprite, false) : false;
    }

    private render(sprite: IRoomObjectSprite, forzar: boolean): boolean
    {
        const v = this._vis;

        if(!v) return false;

        const r = resultadoDe(v, this._escala);
        const destino = destinoPesca(v.fishingTarget);
        const agua = destino ? v.getScreenOffsetTo(destino.x, destino.y, destino.z) : null;
        const look = (r && agua) ? this.aspecto(r) : null;

        if(!look)
        {
            const antes = sprite.visible;

            sprite.visible = false;

            return antes;
        }

        const alfa = (v.layerAlpha * look.alpha) & 255;
        const prof = profundidadAgua(CanaPescaAddition.profundidad(v.bodyDirection, v.posture), agua.z);

        if(!forzar && sprite.visible && (sprite.texture === look.texture) && (sprite.offsetX === look.x) && (sprite.offsetY === look.y) && (sprite.alpha === alfa) && (sprite.relativeDepth === prof)) return false;

        sprite.visible = true;
        sprite.alpha = alfa;
        sprite.texture = look.texture;
        sprite.offsetX = look.x;
        sprite.offsetY = look.y;
        sprite.relativeDepth = prof;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;

        return true;
    }

    private aspecto(r: Resultado): { texture: Texture<Resource>, x: number, y: number, alpha: number }
    {
        switch(this._parte)
        {
            case 'fish': {
                const t = r.fish ? textura('fish', this._vis.fishingCatch.code, this._escala) : null;

                return t ? { texture: t, x: r.fish.x - Math.round(t.width / 2), y: r.fish.y, alpha: r.fish.alpha } : null;
            }
            case 'bobber': {
                const t = r.bobber ? textura('bobber', '', this._escala, this._vis.fishingSkin) : null;

                return t ? { texture: t, x: r.bobber.x - Math.round(t.width / 2), y: r.bobber.y, alpha: 1 } : null;
            }
            case 'sparkles': {
                const chispas = r.sparkles.filter(c => c.size > 0);

                if(!chispas.length) return null;

                const patron = chispasSkin(this._vis.fishingSkin);
                const mx = patron ? Math.floor(patron.pattern[0].length / 2) : 2;
                const my = patron ? Math.floor(patron.pattern.length / 2) : 2;
                const x0 = Math.min(...chispas.map(c => c.x)) - mx;
                const y0 = Math.min(...chispas.map(c => c.y)) - my;
                const clave = `${ this._vis.fishingSkin }|${ chispas.map(c => `${ c.x - x0 },${ c.y - y0 },${ c.size }`).join(';') }`;

                if((clave !== this._clave) || !this._textura) this.pintarChispas(chispas.map(c => ({ x: c.x - x0, y: c.y - y0, size: c.size })), patron, mx, my);

                this._clave = clave;

                return { texture: this._textura, x: x0, y: y0, alpha: 1 };
            }
        }

        return null;
    }

    private pintarChispas(chispas: { x: number, y: number, size: number }[], patron: ReturnType<typeof chispasSkin>, mx: number, my: number): void
    {
        const lienzo = document.createElement('canvas');

        lienzo.width = Math.max(...chispas.map(c => c.x)) + mx + 1;
        lienzo.height = Math.max(...chispas.map(c => c.y)) + my + 1;

        const ctx = lienzo.getContext('2d');

        for(const { x, y, size } of chispas)
        {
            if(patron)
            {
                patron.pattern.forEach((fila, j) => [ ...fila ].forEach((celda, i) =>
                {
                    if(celda === '.') return;

                    ctx.fillStyle = patron.colors[celda];
                    ctx.fillRect(x - mx + i, y - my + j, 1, 1);
                }));

                continue;
            }

            ctx.fillStyle = BLANCO;
            ctx.fillRect(x, y, 1, 1);
            ctx.fillStyle = AMARILLO;
            ctx.fillRect(x - 1, y, 1, 1);
            ctx.fillRect(x + 1, y, 1, 1);
            ctx.fillRect(x, y - 1, 1, 1);
            ctx.fillRect(x, y + 1, 1, 1);

            if(size < 2) continue;

            ctx.fillStyle = DORADO;
            ctx.fillRect(x - 2, y, 1, 1);
            ctx.fillRect(x + 2, y, 1, 1);
            ctx.fillRect(x, y - 2, 1, 1);
            ctx.fillRect(x, y + 2, 1, 1);
        }

        if(this._textura) this._textura.destroy(true);

        this._textura = Texture.from(lienzo, { scaleMode: SCALE_MODES.NEAREST });
    }

    public get id(): number { return this._id; }
}

// ------------------------------------------------------------------ el sedal ($J)

export class SedalPescaAddition implements IAvatarAddition
{
    private _id: number;
    private _vis: IPescaVisualizacion;
    private _escala = 64;
    private _textura: Texture<Resource> = null;
    private _clave = '';

    constructor(id: number, vis: IPescaVisualizacion)
    {
        this._id = id;
        this._vis = vis;
    }

    public dispose(): void
    {
        if(this._textura) this._textura.destroy(true);

        this._textura = null;
        this._vis = null;
    }

    public update(sprite: IRoomObjectSprite, escala: number): void
    {
        if(!sprite) return;

        this._escala = escala;
        this.render(sprite, true);
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        return sprite ? this.render(sprite, false) : false;
    }

    private render(sprite: IRoomObjectSprite, forzar: boolean): boolean
    {
        const v = this._vis;

        if(!v) return false;

        const dir = v.bodyDirection;
        const c = cana(dir, this._escala);
        const destino = destinoPesca(v.fishingTarget);
        const agua = destino ? v.getScreenOffsetTo(destino.x, destino.y, destino.z) : null;

        if(!c || !agua)
        {
            const antes = sprite.visible;

            sprite.visible = false;

            return antes;
        }

        const postura = v.posture;
        const punta = { x: c.tipX, y: c.tipY + CanaPescaAddition.desplazamientoPostura(postura, this._escala) };
        const r = resultadoDe(v, this._escala);
        const puntos = r ? r.line : [ punta, puntoAgua(agua, this._escala) ];
        const color = colorSedal(v.fishingSkin);
        const clave = `${ color }|${ puntos.map(p => `${ p.x },${ p.y }`).join(';') }`;
        const alfa = v.layerAlpha & 255;
        const prof = profundidadAgua(CanaPescaAddition.profundidad(dir, postura), agua.z);

        if(!forzar && (clave === this._clave) && (sprite.texture === this._textura) && (sprite.alpha === alfa) && (sprite.relativeDepth === prof) && sprite.visible) return false;

        if((clave !== this._clave) || !this._textura) this.pintar(puntos, color);

        this._clave = clave;

        sprite.visible = true;
        sprite.alpha = alfa;
        sprite.texture = this._textura;
        sprite.offsetX = Math.min(...puntos.map(p => p.x));
        sprite.offsetY = Math.min(...puntos.map(p => p.y));
        sprite.relativeDepth = prof;
        sprite.alphaTolerance = AlphaTolerance.MATCH_NOTHING;

        return true;
    }

    private pintar(puntos: Punto[], color: number): void
    {
        const x0 = Math.min(...puntos.map(p => p.x));
        const y0 = Math.min(...puntos.map(p => p.y));
        const lienzo = document.createElement('canvas');

        lienzo.width = Math.max(...puntos.map(p => p.x)) - x0 + 1;
        lienzo.height = Math.max(...puntos.map(p => p.y)) - y0 + 1;

        const ctx = lienzo.getContext('2d');

        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');

        for(let i = 1; i < puntos.length; i++)
        {
            const a = puntos[i - 1], b = puntos[i];

            for(const [ x, y ] of lineaPixeles(a.x - x0, a.y - y0, b.x - x0, b.y - y0)) ctx.fillRect(x, y, 1, 1);
        }

        if(this._textura) this._textura.destroy(true);

        this._textura = Texture.from(lienzo, { scaleMode: SCALE_MODES.NEAREST });
    }

    public get id(): number { return this._id; }
}
