import { DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';

/**
 * Aura del avatar: el AuraManager del cliente de Hobbaz (Hobbaz-Auras.zip, aura-manager.js) con sus
 * filtros, parámetros y animaciones tal cual. Lo usan la sala (AvatarVisualization) y la vista
 * previa de la ventana de auras, así que las dos se ven exactamente igual.
 *
 * Se describe con una cadena «filtro|color|coloreable» (FIGURE_AURA; vacía = sin aura):
 *   coloreable 1 = color fijo 0xRRGGBB; 0 = paleta animada (rainbow, gold, fire...).
 * El tiempo de la animación sale del reloj (ms), no de un contador por fotograma: todas las auras
 * iguales de la sala van sincronizadas y no corren más en un monitor de 144 Hz.
 */
export class AvatarAura
{
    public static ANIMACIONES = [ 'rainbow', 'gold', 'fire', 'ice', 'neon', 'pastel', 'sunset', 'lava', 'ocean', 'toxic', 'blood', 'galaxy', 'electric', 'aurora', 'candy', 'void', 'plasma', 'matrix' ];
    public static PULSANTES = [ 'PulseGlowFilter', 'NeonFilter', 'HaloFilter' ];
    public static FILTROS = [ 'OutlineFilter', 'ThickOutlineFilter', 'DropShadowFilter', 'SoftShadowFilter', 'GlowFilter', 'InnerGlowFilter', 'BigGlowFilter', 'PulseGlowFilter', 'OutlineGlowFilter', 'NeonFilter', 'HaloFilter' ];

    // su animationSpeed (.03 por fotograma de requestAnimationFrame, ~60 por segundo) pasado a ms
    private static VELOCIDAD = (0.03 * 60) / 1000;

    public readonly filters: Filter[];

    private _filtro: string;
    private _paleta: string;
    private _glows: GlowFilter[];
    private _fuerzas: number[];

    private constructor(filtro: string, color: string, coloreable: boolean)
    {
        this._filtro = filtro;
        this._paleta = (!coloreable && AvatarAura.ANIMACIONES.includes(color)) ? color : null;

        const c = this._paleta ? AvatarAura.calcularColor(this._paleta, 0) : AvatarAura.leerColor(color);

        this.filters = AvatarAura.crearFiltros(filtro, c);
        this._glows = this.filters.filter(f => (f instanceof GlowFilter)) as GlowFilter[];
        this._fuerzas = this._glows.map(f => f.outerStrength);
    }

    /** null si la cadena no describe un aura conocida */
    public static crear(spec: string): AvatarAura
    {
        if(!spec) return null;

        const [ filtro, color, coloreable ] = spec.split('|');

        if(!AvatarAura.FILTROS.includes(filtro) || !color) return null;

        return new AvatarAura(filtro, color, (coloreable !== '0'));
    }

    public get animada(): boolean
    {
        return (!!this._paleta || AvatarAura.PULSANTES.includes(this._filtro));
    }

    /** avanza la animación al instante `ms` (reloj del ticker) */
    public tick(ms: number): void
    {
        const t = (ms * AvatarAura.VELOCIDAD);

        if(this._paleta)
        {
            const color = AvatarAura.calcularColor(this._paleta, t);

            for(const f of this.filters) (f as any).color = color;
        }

        if(AvatarAura.PULSANTES.includes(this._filtro))
        {
            const k = 1 + (0.45 * Math.sin(t * ((this._filtro === 'HaloFilter') ? 0.6 : 1.4) * 2));

            for(let i = 0; i < this._glows.length; i++) this._glows[i].outerStrength = (this._fuerzas[i] * k);
        }
    }

    private static crearFiltros(filtro: string, c: number): Filter[]
    {
        switch(filtro)
        {
            case 'OutlineFilter': return [ new OutlineFilter({ thickness: 1, color: c }) ];
            case 'ThickOutlineFilter': return [ new OutlineFilter({ thickness: 2, color: c }) ];
            // pixi-filters 6 vuelve al offset {x, y} de Hobbaz (la 4, la de Pixi 6, pedía ángulo 45° y distancia ·√2)
            case 'DropShadowFilter': return [ new DropShadowFilter({ color: c, quality: 20, blur: 0, alpha: 0.6, offset: { x: 2.8, y: 2.8 } }) ];
            case 'SoftShadowFilter': return [ new DropShadowFilter({ color: c, quality: 5, blur: 3, alpha: 0.55, offset: { x: 3.5, y: 3.5 } }) ];
            case 'GlowFilter': return [ new GlowFilter({ color: c, distance: 4, quality: 1 }) ];
            case 'InnerGlowFilter': return [ new GlowFilter({ color: c, distance: 6, outerStrength: 0, innerStrength: 3, quality: 0.5 }) ];
            case 'BigGlowFilter': return [ new GlowFilter({ color: c, distance: 8, outerStrength: 3, quality: 0.5 }) ];
            case 'PulseGlowFilter': return [ new GlowFilter({ color: c, distance: 8, outerStrength: 2.5, quality: 0.5 }) ];
            case 'OutlineGlowFilter': return [ new OutlineFilter({ thickness: 1, color: c }), new GlowFilter({ color: c, distance: 6, outerStrength: 2, quality: 0.5 }) ];
            case 'NeonFilter': return [ new OutlineFilter({ thickness: 2, color: c }), new GlowFilter({ color: c, distance: 10, outerStrength: 3, quality: 0.5 }) ];
            case 'HaloFilter': return [ new GlowFilter({ color: c, distance: 14, outerStrength: 2, innerStrength: 0.5, quality: 0.4 }) ];
        }

        return [];
    }

    public static leerColor(t: string): number
    {
        if(!t) return 0xFFFFFF;
        if(t.startsWith('0x')) return parseInt(t, 16);
        if(t.startsWith('#')) return parseInt(t.substring(1), 16);

        return (parseInt(t, 10) || 0xFFFFFF);
    }

    /** el color de una paleta animada en el instante t (su computeColor) */
    public static calcularColor(paleta: string, e: number): number
    {
        switch(paleta)
        {
            case 'gold': return lerp(16744448, 16773152, osc(0.8 * e));
            case 'fire': return lerp(16711680, 16776960, osc(0.7 * e));
            case 'ice': return lerp(10543359, 16777215, osc(0.7 * e));
            case 'neon': return paso(0.5 * e, [ 16716947, 3800852, 5066239, 16777011, 16736000, 12517631 ]);
            case 'pastel': return onda(0.5 * e, 40, 215, 0, 2, 4);
            case 'sunset': return lerp(16728192, 16760832, osc(0.3 * e));
            case 'lava': return lerp(8388608, 16738816, (0.8 * osc(0.9 * e)) + (0.2 * osc(4.1 * e)));
            case 'ocean': return lerp(14988, 58832, osc(0.5 * e));
            case 'toxic': return lerp(1997312, 11992832, osc(1.6 * e));
            case 'blood': return lerp(3801088, 14680064, osc(1.2 * e));
            case 'galaxy': return degradado(0.4 * e, [ 4915330, 2003199, 16716947, 9055202 ]);
            case 'electric': return ((Math.sin(17 * e) * Math.sin(5.3 * e)) > 0.55) ? 16777215 : lerp(43263, 8255999, osc(2.5 * e));
            case 'aurora': return degradado(0.35 * e, [ 65436, 54527, 10309341, 65436 ]);
            case 'candy': return lerp(16738740, 8255999, osc(0.8 * e));
            case 'void': return lerp(655380, 6947016, osc(0.6 * e));
            case 'plasma': return degradado(1.2 * e, [ 16711935, 16738816, 16776960, 16711935 ]);
            case 'matrix': return (Math.sin(23 * e) > 0.85) ? 13434828 : lerp(15104, 65345, osc(2 * e));
            case 'rainbow':
            default: return onda(e, 127, 128, 0, 2, 4);
        }
    }
}

const osc = (t: number) => ((Math.sin(t) + 1) / 2);

const onda = (t: number, e: number, s: number, r: number, i: number, n: number) =>
    ((Math.floor((Math.sin(t + r) * e) + s) << 16) | (Math.floor((Math.sin(t + i) * e) + s) << 8) | Math.floor((Math.sin(t + n) * e) + s));

const lerp = (a: number, b: number, s: number) =>
{
    s = Math.max(0, Math.min(1, s));

    return (Math.round((a >> 16 & 255) + (((b >> 16 & 255) - (a >> 16 & 255)) * s)) << 16)
        | (Math.round((a >> 8 & 255) + (((b >> 8 & 255) - (a >> 8 & 255)) * s)) << 8)
        | Math.round((a & 255) + (((b & 255) - (a & 255)) * s));
};

const degradado = (t: number, colores: number[]) =>
{
    const n = colores.length, r = (((t % n) + n) % n), i = Math.floor(r);

    return lerp(colores[i], colores[(i + 1) % n], r - i);
};

const paso = (t: number, colores: number[]) => colores[Math.floor((((t % colores.length) + colores.length) % colores.length))];
