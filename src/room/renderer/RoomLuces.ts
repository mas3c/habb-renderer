import { BLEND_MODES } from '@pixi/constants';
import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { IRoomObject, IRoomObjectSprite } from '../../api';
import { PixiApplicationProxy } from '../../pixi-proxy';

/**
 * Iluminación dinámica (prototipo del laboratorio).
 *
 * - Oscurecido: cada sprite de la sala se tiñe con el color ambiente (el tinte va en el vértice: no cuesta una pasada).
 *   No se oscurecen las capas ADD del furni (ya son luz) ni las capas emisivas de un furni con la luz encendida.
 * - Luces: sprites con un degradado generado una vez, mezcla «luz» = escena × (1 + luz): aclaran lo que hay debajo
 *   (suelo, paredes, avatares) sin pintar encima un velo de color.
 *
 * Datos: { "<classname>": [ { tipo, color, radio, intensidad, desplazamiento: {x, y}, parpadeo, velocidad, estados, emisivas } ] }
 *   tipo: glow (halo), wall (rectángulo en la pared), cone (haz hacia abajo), area (mancha en el suelo)
 *   radio y desplazamiento en píxeles a zoom 1 (64); desplazamiento.x se refleja en las direcciones 4-7
 *   estados: "siempre" o lista de estados del furni en que está encendida; emisivas: letras de capa que no se oscurecen
 */
export interface ILuzFurni
{
    tipo: 'glow' | 'wall' | 'cone' | 'area';
    color?: string;
    radio?: number;
    intensidad?: number;
    desplazamiento?: { x?: number, y?: number };
    parpadeo?: number;
    velocidad?: number;
    estados?: 'siempre' | number[];
    emisivas?: string[];
    largo?: number;
}

interface ILuzViva
{
    luces: ILuzFurni[];
    sprites: Sprite[][]; // por luz
    visto: number;
    encendida: boolean;
    fase: number;
}

const BLEND_LUZ = 30; // libre en la tabla de mezclas de Pixi 6 (llega hasta 29)

export class RoomLuces
{
    private static _texturas: { radial: Texture, haz: Texture, rect: Texture } = null;

    private _defs: Map<string, ILuzFurni[]>;
    private _ambiente: number;
    private _capa: Container;
    private _vivas: Map<string, ILuzViva> = new Map();
    private _ronda = 0;

    constructor(defs: { [classname: string]: ILuzFurni[] }, ambiente: number)
    {
        this._defs = new Map(Object.entries(defs || {}).filter(([ , v ]) => Array.isArray(v) && v.length));
        this._ambiente = ambiente;
        this._capa = new Container();

        RoomLuces.preparar();
    }

    private static preparar(): void
    {
        if(RoomLuces._texturas) return;

        const renderer = (PixiApplicationProxy.instance?.renderer as any);
        const gl: WebGLRenderingContext = renderer?.gl;

        // escena × (1 + luz); el alfa del destino no se toca
        if(gl && renderer.state?.blendModes) renderer.state.blendModes[BLEND_LUZ] = [ gl.DST_COLOR, gl.ONE, gl.ZERO, gl.ONE ];

        const lienzo = (w: number, h: number, pintar: (c: CanvasRenderingContext2D) => void) =>
        {
            const canvas = document.createElement('canvas');

            canvas.width = w;
            canvas.height = h;

            pintar(canvas.getContext('2d'));

            return Texture.from(canvas);
        };

        const radial = lienzo(128, 128, c =>
        {
            const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);

            [ [ 0, 1 ], [ 0.2, 0.75 ], [ 0.45, 0.35 ], [ 0.7, 0.1 ], [ 1, 0 ] ].forEach(([ o, a ]) => g.addColorStop(o, `rgba(255,255,255,${ a })`));

            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
        });

        const haz = lienzo(64, 128, c =>
        {
            const g = c.createLinearGradient(0, 0, 0, 128);

            g.addColorStop(0, 'rgba(255,255,255,0.9)');
            g.addColorStop(1, 'rgba(255,255,255,0)');

            c.filter = 'blur(5px)';
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(26, 4);
            c.lineTo(38, 4);
            c.lineTo(58, 124);
            c.lineTo(6, 124);
            c.fill();
        });

        const rect = lienzo(64, 64, c =>
        {
            c.filter = 'blur(7px)';
            c.fillStyle = '#fff';
            c.fillRect(14, 14, 36, 36);
        });

        RoomLuces._texturas = { radial, haz, rect };
    }

    public get capa(): Container
    {
        return this._capa;
    }

    public set ambiente(color: number)
    {
        this._ambiente = color;
    }

    private static tipo(object: IRoomObject): string
    {
        const tipo = object.type;
        const i = tipo ? tipo.indexOf('*') : -1;

        return ((i > 0) ? tipo.substring(0, i) : tipo);
    }

    /** cada objeto de la sala, cada fotograma, con su posición en el lienzo (antes de escalar) */
    public objeto(object: IRoomObject, identificador: string, x: number, y: number, escala: number): void
    {
        const luces = this._defs.get(RoomLuces.tipo(object));

        if(!luces) return;

        let viva = this._vivas.get(identificador);

        if(!viva)
        {
            viva = { luces, sprites: [], visto: 0, encendida: false, fase: ((object.id * 7.31) % 10) };

            for(const luz of luces)
            {
                const sprites = this.crear(luz);

                viva.sprites.push(sprites);

                for(const sprite of sprites) this._capa.addChild(sprite);
            }

            this._vivas.set(identificador, viva);
        }

        viva.visto = this._ronda;

        const estado = object.getState(0);
        const k = (escala / 64);
        const espejo = (Math.round(((object.getDirection()?.x || 0) % 360) / 45) >= 4) ? -1 : 1;
        const pared = Math.round(((object.getDirection()?.x || 0) % 360) / 45);
        const t = (performance.now() / 1000);

        viva.encendida = false;

        for(let i = 0; i < viva.luces.length; i++)
        {
            const luz = viva.luces[i];

            const encendida = ((luz.estados === undefined) || (luz.estados === 'siempre') || (Array.isArray(luz.estados) && luz.estados.includes(estado)));

            if(encendida) viva.encendida = true;

            let intensidad = (luz.intensidad ?? 0.8);

            if(luz.parpadeo)
            {
                const v = ((luz.velocidad ?? 1) * t) + viva.fase;
                const ruido = ((Math.sin(v * 7.3) + Math.sin(v * 13.1) * 0.6 + Math.sin(v * 23.7) * 0.3) / 1.9); // −1..1, sin patrón visible

                intensidad *= (1 - (luz.parpadeo * (0.5 + 0.5 * ruido)));
            }

            const px = (x + ((luz.desplazamiento?.x || 0) * espejo * k));
            const py = (y + ((luz.desplazamiento?.y || 0) * k));
            const r = ((luz.radio ?? 80) * k);

            for(const sprite of viva.sprites[i])
            {
                sprite.visible = encendida;

                if(!encendida) continue;

                // ADD = brillo que se ve también sobre el negro (núcleo del halo, haz del foco); la «luz» va en dos pasadas:
                // escena × (1 + i/2)², hasta ×4 con intensidad 2, para que la penumbra no se coma la luz
                const nucleo = (sprite.blendMode === BLEND_MODES.ADD);

                sprite.position.set(px, py);
                sprite.alpha = (nucleo ? (intensidad * 0.3) : Math.min(1, (intensidad / 2)));

                switch(luz.tipo)
                {
                    case 'area':
                        sprite.width = (r * 2);
                        sprite.height = r;
                        break;
                    case 'wall':
                        sprite.width = (r * 2);
                        sprite.height = (r * 2.4);
                        sprite.skew.y = ((pared === 2) ? 0.4636 : ((pared === 4) ? -0.4636 : 0)); // atan(0,5): la pendiente de la pared
                        break;
                    case 'cone':
                        if(sprite.anchor.y === 0)
                        {
                            sprite.width = (r * 1.2);
                            sprite.height = ((luz.largo ?? r * 1.6) * k);
                        }
                        else
                        {
                            sprite.position.set(px, (py + ((luz.largo ?? r * 1.6) * k)));
                            sprite.width = (r * 1.6);
                            sprite.height = (r * 0.8);
                        }
                        break;
                    default:
                        sprite.width = sprite.height = (nucleo ? (r * 0.7) : (r * 2));
                }
            }
        }
    }

    private crear(luz: ILuzFurni): Sprite[]
    {
        const { radial, haz, rect } = RoomLuces._texturas;
        const color = (parseInt(String(luz.color || 'ffffff').replace('#', ''), 16) || 0xFFFFFF);
        const nuevo = (textura: Texture, mezcla: number, anclaY = 0.5) =>
        {
            const s = new Sprite(textura);

            s.anchor.set(0.5, anclaY);
            s.tint = color;
            s.blendMode = mezcla;
            s.visible = false;

            return s;
        };

        switch(luz.tipo)
        {
            case 'area': return [ nuevo(radial, BLEND_LUZ), nuevo(radial, BLEND_LUZ) ];
            case 'wall': return [ nuevo(rect, BLEND_LUZ), nuevo(rect, BLEND_LUZ) ];
            case 'cone': return [ nuevo(haz, BLEND_MODES.ADD, 0), nuevo(radial, BLEND_LUZ), nuevo(radial, BLEND_LUZ) ];
            default: return [ nuevo(radial, BLEND_LUZ), nuevo(radial, BLEND_LUZ), nuevo(radial, BLEND_MODES.ADD) ]; // halo + brillo en el centro
        }
    }

    /** tras recorrer los objetos: quita las luces de lo que ya no está y coloca la capa como el lienzo */
    public terminar(display: Container): void
    {
        for(const [ id, viva ] of this._vivas)
        {
            if(viva.visto === this._ronda) continue;

            for(const sprites of viva.sprites) for(const sprite of sprites) sprite.destroy(); // la textura es compartida: no se toca

            this._vivas.delete(id);
        }

        this._ronda++;

        this._capa.position.copyFrom(display.position);
        this._capa.scale.copyFrom(display.scale);
    }

    /** tinte del sprite con la sala oscurecida */
    public tinte(sprite: IRoomObjectSprite, identificador: string): number
    {
        const color = sprite.color;

        if(sprite.blendMode === BLEND_MODES.ADD) return color;

        const viva = this._vivas.get(identificador);

        if(viva && viva.encendida && sprite.type && sprite.name)
        {
            // nombre del asset: <tipo>_<tamaño>_<capa>_<dirección>_<fotograma>
            const capa = sprite.name.substring(sprite.type.length + 1).split('_')[1];

            if(capa && viva.luces.some(luz => luz.emisivas && luz.emisivas.includes(capa))) return color;
        }

        const a = this._ambiente;

        return ((((((color >> 16) & 0xFF) * ((a >> 16) & 0xFF)) / 255) << 16) | (((((color >> 8) & 0xFF) * ((a >> 8) & 0xFF)) / 255) << 8) | (((color & 0xFF) * (a & 0xFF)) / 255));
    }

    public dispose(): void
    {
        this._vivas.clear();
        this._capa.destroy({ children: true }); // sin texture: las texturas son compartidas y viven toda la sesión
        this._capa = null;
    }
}
