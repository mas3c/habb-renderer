import { AvatarAura } from './AvatarAura';

/**
 * Estela al andar (idea propia de Habb): al caminar, el keko suelta partículas en las baldosas por las que
 * pasa y se desvanecen en ~1 s. Se describe con «efecto|color» (FIGURE_ESTELA; vacía = ninguna):
 *   efecto: huellas, chispas, burbujas, humo, petalos, hojas, nieve, corazones, estrellas, notas, fuego,
 *           hielo, rayos, arcoiris, galaxia, portal
 *   color:  0xRRGGBB, una paleta animada de las auras (rainbow, gold, fire…) o vacío (los suyos).
 *
 * Es solo dibujo: guarda las partículas en coordenadas de la sala (baldosas) y las pinta en un lienzo 2D
 * relativo a los pies del avatar con la proyección isométrica fija de Habbo. La usan EstelaAddition (sala)
 * y la vista previa del catálogo, así que se ven igual.
 */
interface Particula
{
    x: number;
    y: number;
    z: number;
    t0: number;
    s: number;     // azar fijo de la partícula (0-1)
    lado: number;  // huellas: pie izquierdo / derecho
    n: number;     // número de orden (el arcoíris va cambiando de color)
}

interface Efecto
{
    vida: number;      // ms que dura cada partícula
    paso: number;      // cada cuántas baldosas recorridas suelta
    cuantas: number;   // cuántas suelta cada vez
}

const EFECTOS: Record<string, Efecto> = {
    huellas: { vida: 1400, paso: 0.5, cuantas: 1 },
    chispas: { vida: 900, paso: 0.3, cuantas: 2 },
    burbujas: { vida: 1200, paso: 0.4, cuantas: 1 },
    humo: { vida: 1200, paso: 0.35, cuantas: 1 },
    petalos: { vida: 1400, paso: 0.3, cuantas: 2 },
    hojas: { vida: 1400, paso: 0.3, cuantas: 2 },
    nieve: { vida: 1300, paso: 0.3, cuantas: 2 },
    corazones: { vida: 1100, paso: 0.4, cuantas: 1 },
    estrellas: { vida: 1000, paso: 0.35, cuantas: 1 },
    notas: { vida: 1100, paso: 0.45, cuantas: 1 },
    fuego: { vida: 650, paso: 0.18, cuantas: 2 },
    hielo: { vida: 1300, paso: 0.4, cuantas: 1 },
    rayos: { vida: 450, paso: 0.4, cuantas: 1 },
    arcoiris: { vida: 750, paso: 0.1, cuantas: 1 },
    galaxia: { vida: 1100, paso: 0.25, cuantas: 2 },
    portal: { vida: 900, paso: 0.55, cuantas: 1 }
};

// dibujos de pixel art (1 = píxel)
const DIBUJOS: Record<string, string[]> = {
    huella: [ '011', '111', '011', '000', '011' ],
    chispa: [ '010', '111', '010' ],
    chispaGrande: [ '00100', '00100', '11011', '00100', '00100' ],
    burbuja: [ '01110', '10001', '10001', '10001', '01110' ],
    bola: [ '0110', '1111', '1111', '0110' ],
    petalo: [ '0110', '1111', '0110' ],
    hoja: [ '0011', '0111', '1110', '1000' ],
    copo: [ '10101', '01110', '11111', '01110', '10101' ],
    corazon: [ '01010', '11111', '11111', '01110', '00100' ],
    estrella: [ '00100', '01110', '11111', '01110', '01010' ],
    nota: [ '0011', '0010', '0010', '1110', '1110' ],
    llama: [ '0100', '0110', '1110', '1111', '0110' ],
    cristal: [ '010', '111', '111', '010' ],
    rayo: [ '100', '010', '001', '010', '100', '010' ]
};

const MAX_PARTICULAS = 90;
// las vidas de EFECTOS se alargan un 40 % (en la sala, a 2 baldosas/s, el rastro quedaba muy corto)
const DURA = 1.4;
const HOJAS = [ 0xE65100, 0xF9A825, 0x8D2B0B, 0xC62828 ];

export class AvatarEstela
{
    public readonly efecto: string;
    private _efecto: Efecto;
    private _color: number;
    private _paleta: string;
    private _particulas: Particula[] = [];
    private _ultima: { x: number, y: number } = null;
    private _lado = 1;
    private _orden = 0;

    private constructor(efecto: string, color: string)
    {
        this.efecto = efecto;
        this._efecto = EFECTOS[efecto];
        this._paleta = (color && AvatarAura.ANIMACIONES.includes(color)) ? color : null;
        this._color = (!this._paleta && color) ? AvatarAura.leerColor(color) : null;
    }

    /** null si la cadena no describe una estela conocida */
    public static crear(spec: string): AvatarEstela
    {
        if(!spec) return null;

        const [ efecto, color ] = spec.split('|');

        if(!EFECTOS[efecto]) return null;

        return new AvatarEstela(efecto, (color || ''));
    }

    public get vivas(): boolean
    {
        return (this._particulas.length > 0);
    }

    /**
     * El avatar está en (x, y, z) de la sala: si ha andado lo bastante desde la última vez, suelta partículas
     * donde estaba. Un salto grande (teletransporte, entrar) no deja rastro.
     */
    public paso(x: number, y: number, z: number, ahora: number): void
    {
        this._particulas = this._particulas.filter(p => ((ahora - p.t0) < (this._efecto.vida * DURA)));

        if(!this._ultima)
        {
            this._ultima = { x, y };

            return;
        }

        const d = Math.hypot((x - this._ultima.x), (y - this._ultima.y));

        if(d > 2.5)
        {
            this._ultima = { x, y };

            return;
        }

        if(d < this._efecto.paso) return;

        for(let i = 0; i < this._efecto.cuantas; i++)
        {
            this._particulas.push({ x, y, z, t0: ahora, s: Math.random(), lado: this._lado, n: this._orden++ });
        }

        this._lado = -this._lado;
        this._ultima = { x, y };

        if(this._particulas.length > MAX_PARTICULAS) this._particulas.splice(0, (this._particulas.length - MAX_PARTICULAS));
    }

    /**
     * Pinta las partículas vivas en ctx con los pies del avatar en (cx, cy) y el avatar en (ax, ay, az) de la
     * sala. escala: la de la sala (64 normal, 32 alejada).
     */
    public pintar(ctx: CanvasRenderingContext2D, cx: number, cy: number, ax: number, ay: number, az: number, ahora: number, escala: number): void
    {
        const k = (escala >= 48) ? 3 : 1;
        const medio = (escala / 2), cuarto = (escala / 4);

        ctx.imageSmoothingEnabled = false;

        for(const p of this._particulas)
        {
            const a = Math.min(1, Math.max(0, (ahora - p.t0) / (this._efecto.vida * DURA)));
            const dx = (p.x - ax), dy = (p.y - ay);
            const sx = cx + ((dx - dy) * medio);
            const sy = cy + ((dx + dy) * cuarto) - ((p.z - az) * medio);

            this.particula(ctx, p, a, Math.round(sx), Math.round(sy), k, ahora);
        }

        ctx.globalAlpha = 1;
    }

    private color(p: Particula, ahora: number, porDefecto: number): number
    {
        if(this._paleta) return AvatarAura.calcularColor(this._paleta, (ahora * 0.0018) + (p.s * 3));

        return (this._color ?? porDefecto);
    }

    private particula(ctx: CanvasRenderingContext2D, p: Particula, a: number, x: number, y: number, k: number, ahora: number): void
    {
        const desvanece = (1 - a);
        const vaiven = Math.round(Math.sin((a * 6) + (p.s * 6)) * 3 * k);
        const azar = Math.round((p.s - 0.5) * 14 * k);

        switch(this.efecto)
        {
            case 'huellas':
                ctx.globalAlpha = 0.8 * desvanece;
                dibujar(ctx, DIBUJOS.huella, x + (p.lado * 3 * k), y - (2 * k), k, this.color(p, ahora, 0xFFFFFF));
                return;
            case 'chispas': {
                ctx.globalAlpha = desvanece * ((Math.sin((ahora / 60) + (p.s * 20)) > -0.3) ? 1 : 0.4);
                const grande = (a < 0.25);
                dibujar(ctx, grande ? DIBUJOS.chispaGrande : DIBUJOS.chispa, x + azar, y - Math.round((4 + (a * 14)) * k) - Math.round(p.s * 8 * k), k, this.color(p, ahora, 0xFFD54F));
                return;
            }
            case 'burbujas':
                ctx.globalAlpha = 0.85 * desvanece;
                dibujar(ctx, DIBUJOS.burbuja, x + azar + vaiven, y - Math.round((6 + (a * 26)) * k), k, this.color(p, ahora, 0x81D4FA));
                return;
            case 'humo':
                ctx.globalAlpha = 0.45 * desvanece;
                dibujar(ctx, DIBUJOS.bola, x + Math.round(azar / 2), y - Math.round((2 + (a * 10)) * k), Math.max(1, Math.round(k * (1 + (a * 1.6)))), this.color(p, ahora, 0x9E9E9E));
                return;
            case 'petalos':
            case 'hojas':
            case 'nieve': {
                // caen desde la altura de las rodillas hasta el suelo, con vaivén
                ctx.globalAlpha = (a > 0.75) ? ((1 - a) / 0.25) : 1;
                const caida = Math.round((18 - (Math.min(1, a * 1.4) * 18)) * k);
                const dibujo = (this.efecto === 'nieve') ? DIBUJOS.copo : (this.efecto === 'hojas') ? DIBUJOS.hoja : DIBUJOS.petalo;
                const porDefecto = (this.efecto === 'hojas') ? HOJAS[Math.floor(p.s * HOJAS.length)] : (this.efecto === 'nieve') ? 0xFFFFFF : 0xF8BBD0;
                dibujar(ctx, dibujo, x + azar + vaiven, y - caida - (2 * k), k, this.color(p, ahora, porDefecto));
                return;
            }
            case 'corazones':
            case 'estrellas':
            case 'notas': {
                ctx.globalAlpha = desvanece;
                const dibujo = (this.efecto === 'corazones') ? DIBUJOS.corazon : (this.efecto === 'estrellas') ? DIBUJOS.estrella : DIBUJOS.nota;
                const porDefecto = (this.efecto === 'corazones') ? 0xFF4D6D : (this.efecto === 'estrellas') ? 0xFFE066 : 0x7E57C2;
                dibujar(ctx, dibujo, x + Math.round(azar / 2) + vaiven, y - Math.round((6 + (a * 22)) * k), k, this.color(p, ahora, porDefecto));
                return;
            }
            case 'fuego': {
                ctx.globalAlpha = desvanece;
                // de amarillo a rojo según se consume
                const fuego = (a < 0.35) ? 0xFFE082 : (a < 0.7) ? 0xFF9800 : 0xE53935;
                const color = this._paleta ? this.color(p, ahora, fuego) : (this._color ?? fuego);
                dibujar(ctx, DIBUJOS.llama, x + Math.round(azar / 2), y - Math.round((2 + (a * 14)) * k), k, color);
                return;
            }
            case 'hielo':
                ctx.globalAlpha = 0.9 * desvanece;
                dibujar(ctx, DIBUJOS.cristal, x + azar, y - (3 * k), k, this.color(p, ahora, 0x9BE7FF));
                return;
            case 'rayos':
                ctx.globalAlpha = (Math.sin((ahora / 25) + (p.s * 10)) > 0) ? desvanece : (desvanece * 0.2);
                dibujar(ctx, DIBUJOS.rayo, x + azar, y - Math.round((6 + (p.s * 14)) * k), k, this.color(p, ahora, 0x80D8FF));
                return;
            case 'arcoiris': {
                // una cinta: cada trozo de un color, en orden
                ctx.globalAlpha = 0.85 * desvanece;
                const colores = [ 0xE53935, 0xFB8C00, 0xFDD835, 0x43A047, 0x1E88E5, 0x8E24AA ];
                const color = this._paleta ? this.color(p, ahora, 0) : colores[p.n % colores.length];
                ctx.fillStyle = hex(color);
                ctx.fillRect(x - (3 * k), y - (3 * k), (6 * k), (3 * k));
                return;
            }
            case 'galaxia': {
                ctx.globalAlpha = desvanece * ((Math.sin((ahora / 90) + (p.s * 30)) > -0.5) ? 1 : 0.35);
                const color = this._paleta || this._color ? this.color(p, ahora, 0) : AvatarAura.calcularColor('galaxy', (ahora * 0.0018) + (p.s * 3));
                dibujar(ctx, (p.s > 0.6) ? DIBUJOS.estrella : DIBUJOS.chispa, x + azar, y - Math.round((4 + (p.s * 22) + (a * 6)) * k), k, color);
                return;
            }
            case 'portal': {
                // un anillo en el suelo que se abre
                ctx.globalAlpha = 0.9 * desvanece;
                ctx.strokeStyle = hex(this.color(p, ahora, 0xB388FF));
                ctx.lineWidth = k;
                ctx.beginPath();
                ctx.ellipse(x, y - k, Math.max(1, (3 + (a * 12)) * k), Math.max(1, (1.5 + (a * 6)) * k), 0, 0, (Math.PI * 2));
                ctx.stroke();
                return;
            }
        }
    }
}

const hex = (c: number) => ('#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6));

/** un dibujo de pixel art centrado en x y con la base en y */
const dibujar = (ctx: CanvasRenderingContext2D, dibujo: string[], x: number, y: number, k: number, color: number) =>
{
    const ancho = dibujo[0].length, alto = dibujo.length;
    const ox = x - Math.floor((ancho * k) / 2), oy = y - (alto * k);

    ctx.fillStyle = hex(color);

    for(let fila = 0; fila < alto; fila++)
    {
        for(let col = 0; col < ancho; col++)
        {
            if(dibujo[fila][col] === '1') ctx.fillRect(ox + (col * k), oy + (fila * k), k, k);
        }
    }
};
