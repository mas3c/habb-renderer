/**
 * Animaciones de los comandos de interacción (:besar, :hug, :slap, :punch, :kill, :smoke, :sex): pixel art dibujado a
 * mano en un lienzo delante del keko (AccionAddition). Llegan por el paquete del Splash con la fase «accion» y el spec
 * «nombre:lado», donde lado (-1 / 1) es hacia qué lado de la pantalla está el otro avatar.
 *
 * Coordenadas en píxeles del keko a escala 64: (0, 0) son los pies y la y negativa va hacia arriba.
 */

const VUELTA = Math.PI * 2;
// el keko mide unos 88 px desde los pies (como en el Splash): la cara queda hacia -66
const CABEZA_Y = -66;
const BOCA_Y = -54;
const PECHO_Y = -36;

type Color = string;

/** un dibujo de pixel art: cada letra es un color de la paleta, el punto es transparente */
interface Dibujo { filas: string[], paleta: { [letra: string]: Color } }

const CORAZON: Dibujo = { filas: [
    '.rr.rr.',
    'rRRrRRr',
    'rRWRRRr',
    'rRRRRRr',
    '.rRRRr.',
    '..rRr..',
    '...r...'
], paleta: { r: '#a3123a', R: '#ff3b6b', W: '#ffd1dc' } };

const CORAZON_PEQUE: Dibujo = { filas: [
    'R.R',
    'RRR',
    '.R.'
], paleta: { R: '#ff5c86' } };

const LABIOS: Dibujo = { filas: [
    '..rr.rr..',
    '.rRRrRRr.',
    'rRRRRRRRr',
    '.rRWWRRr.',
    '..rRRRr..'
], paleta: { r: '#7a0a26', R: '#e0164f', W: '#ff8fae' } };

const MANO: Dibujo = { filas: [
    '.r.r.r.',
    '.r.r.r.',
    'rrrrrr.',
    'rrrrrrr',
    'rrrrrr.',
    '.rrrr..'
], paleta: { r: '#e83a3a' } };

const ESTRELLA: Dibujo = { filas: [
    '..y..',
    '.yYy.',
    'yYYYy',
    '.yYy.',
    '..y..'
], paleta: { y: '#e0a800', Y: '#fff176' } };

const FANTASMA: Dibujo = { filas: [
    '..www..',
    '.wWWWw.',
    'wWkWkWw',
    'wWWWWWw',
    'wWWoWWw',
    'wWWWWWw',
    'wW.W.Ww'
], paleta: { w: '#9fb3c8', W: '#f4f8ff', k: '#20263a', o: '#5a6b85' } };

const CALAVERA: Dibujo = { filas: [
    '.wwwww.',
    'wWWWWWw',
    'WkkWkkW',
    'WkkWkkW',
    'wWWkWWw',
    '.WkWkW.',
    '.w.w.w.'
], paleta: { w: '#c9ced8', W: '#ffffff', k: '#1c1f2b' } };

/** revólver mirando a la derecha: acero con brillo, tambor, guardamonte y culata de madera */
const REVOLVER: Dibujo = { filas: [
    '.kkkkkkkkkkkkkkk.',
    'kwwwwwwwwwwwwwwGk',
    'kGGGGGGGGGGGGGGgk',
    'kkgGGGGGgkkkkkkkk',
    '.kgGwwGGgk.......',
    '.kgGGGGGgk.......',
    'kBBkkkkkkk.......',
    'kBbBk.k.k........',
    'kBbBk..k.........',
    'kkkk.............'
], paleta: { k: '#16181e', w: '#e3e8ef', G: '#8d97a8', g: '#4a5160', B: '#9a5d34', b: '#6b3f22' } };

/** dónde está la boca del cañón en el dibujo (celdas desde el centro) */
const BOCA_CANON = { x: 8, y: -3.5 };

/** punta del cañón del efecto 164 (pistola de Habbo) según la rotación del keko, medida en el juego a zoom 1 */
const CANON_164: { x: number, y: number }[] = [
    { x: 36, y: -44 }, { x: 36, y: -44 }, { x: 16, y: -25 }, { x: 16, y: -25 },
    { x: -30, y: -30 }, { x: -30, y: -30 }, { x: -24, y: -38 }, { x: -24, y: -38 }
];

/** hacia dónde va la bala en pantalla según la rotación */
const RUMBO: { x: number, y: number }[] = [
    { x: 0.89, y: -0.45 }, { x: 1, y: 0 }, { x: 0.89, y: 0.45 }, { x: 0, y: 1 },
    { x: -0.89, y: 0.45 }, { x: -1, y: 0 }, { x: -0.89, y: -0.45 }, { x: 0, y: -1 }
];

/** cigarrillo: filtro naranja, papel, ceniza y brasa (la brasa la pinta aparte el resplandor) */
const CIGARRILLO: Dibujo = { filas: [ 'oowwwwwwga' ], paleta: { o: '#e0903a', w: '#f4f4f0', g: '#9a9a9a', a: '#ff6a1a' } };

/** porro: boquilla fina en la boca y se abre hacia la punta */
const PORRO = (papel: string): Dibujo => ({ filas: [
    '....pppgg.',
    'kpppPPPPga',
    '....pppgg.'
], paleta: { k: '#d9c49a', p: papel, P: '#ffffff', g: '#8a8a8a', a: '#ff6a1a' } });

/** puro: grueso, marrón, con vitola roja */
const PURO: Dibujo = { filas: [
    'bBBrBBBBBga',
    'bBBrBBBBBga'
], paleta: { b: '#5e3a1f', B: '#8a5a2e', r: '#c0282d', g: '#9a9a9a', a: '#ff6a1a' } };

/** hoja pequeña de 5x5 */
const HOJA: Dibujo = { filas: [
    '..g..',
    'g.g.g',
    '.ggg.',
    '..g..',
    '..g..'
], paleta: { g: '#4caf50' } };

/** letras de 3x5 para los rótulos de cómic */
const LETRAS: { [l: string]: string[] } = {
    P: [ 'XX.', 'X.X', 'XX.', 'X..', 'X..' ],
    O: [ '.X.', 'X.X', 'X.X', 'X.X', '.X.' ],
    W: [ 'X.X', 'X.X', 'X.X', 'XXX', 'X.X' ],
    '!': [ 'X', 'X', 'X', '.', 'X' ],
    Z: [ 'XXX', '..X', '.X.', 'X..', 'XXX' ],
    K: [ 'X.X', 'X.X', 'XX.', 'X.X', 'X.X' ],
    C: [ '.XX', 'X..', 'X..', 'X..', '.XX' ],
    F: [ 'XXX', 'X..', 'XX.', 'X..', 'X..' ],
    A: [ '.X.', 'X.X', 'XXX', 'X.X', 'X.X' ],
    H: [ 'X.X', 'X.X', 'XXX', 'X.X', 'X.X' ],
    I: [ 'X', 'X', 'X', 'X', 'X' ],
    S: [ '.XX', 'X..', '.X.', '..X', 'XX.' ],
    '¡': [ 'X', '.', 'X', 'X', 'X' ],
    '.': [ '.', '.', '.', '.', 'X' ]
};

const ROSAS = [ '#ff3b6b', '#ff6f91', '#ff9fb8', '#ffd1dc', '#ff2f5c', '#ffc0cb' ];
const HUMOS = [ '#c7ccd6', '#b3b9c4', '#d9dde4', '#a5acb8' ];

const facil = (x: number) => Math.max(0, Math.min(1, x));
const salida = (x: number) => 1 - Math.pow(1 - facil(x), 3);
const entre = (t: number, a: number, b: number) => facil((t - a) / (b - a));
/** sube de 0 a 1 entre a y b, se queda, y baja de 1 a 0 entre c y d */
const tramo = (t: number, a: number, b: number, c: number, d: number) => Math.min(entre(t, a, b), 1 - entre(t, c, d));

class Lienzo
{
    constructor(private g: CanvasRenderingContext2D, private bx: number, private by: number, private escala: number) {}

    private alfa(a: number): boolean
    {
        if(a <= 0.02) return false;

        this.g.globalAlpha = Math.min(1, a);

        return true;
    }

    public punto(x: number, y: number, tam: number, color: Color, a = 1): void
    {
        if(!this.alfa(a)) return;

        const s = Math.max(1, Math.round(tam * this.escala));

        this.g.fillStyle = color;
        this.g.fillRect(this.bx + Math.round(x * this.escala - s / 2), this.by + Math.round(y * this.escala - s / 2), s, s);
    }

    /** un dibujo de pixel art centrado en (x, y), a «px» píxeles de keko por celda */
    public dibujo(d: Dibujo, x: number, y: number, px: number, a = 1, espejo = false): void
    {
        if(!this.alfa(a)) return;

        const alto = d.filas.length, ancho = d.filas[0].length;
        const celda = Math.max(1, Math.round(px * this.escala));
        const x0 = this.bx + Math.round(x * this.escala - (ancho * celda) / 2), y0 = this.by + Math.round(y * this.escala - (alto * celda) / 2);

        for(let f = 0; f < alto; f++)
        {
            for(let c = 0; c < ancho; c++)
            {
                const letra = d.filas[f][espejo ? (ancho - 1 - c) : c];
                const color = d.paleta[letra];

                if(!color) continue;

                this.g.fillStyle = color;
                this.g.fillRect(x0 + c * celda, y0 + f * celda, celda, celda);
            }
        }
    }

    public texto(texto: string, x: number, y: number, px: number, color: Color, borde: Color, a = 1): void
    {
        const ancho = texto.split('').reduce((s, l) => s + (LETRAS[l] ? LETRAS[l][0].length + 1 : 2), -1);
        let cx = x - (ancho * px) / 2;

        for(const l of texto.split(''))
        {
            const forma = LETRAS[l];

            if(!forma) { cx += 2 * px; continue; }

            const filas = forma.map(f => ({ filas: [ f ], paleta: { X: color } }));

            // borde: la letra un píxel más grande por detrás
            for(const [ dx, dy ] of [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ])
            {
                forma.forEach((fila, i) => this.dibujo({ filas: [ fila ], paleta: { X: borde } }, cx + (fila.length * px) / 2 + dx * px * 0.6, y + i * px + dy * px * 0.6, px, a));
            }

            filas.forEach((d, i) => this.dibujo(d, cx + (forma[0].length * px) / 2, y + i * px, px, a));
            cx += (forma[0].length + 1) * px;
        }
    }

    public estrellaComic(x: number, y: number, r: number, puntas: number, giro: number, color: Color, a = 1): void
    {
        if(!this.alfa(a) || r < 1) return;

        const g = this.g;

        g.fillStyle = color;
        g.beginPath();

        for(let i = 0; i < puntas * 2; i++)
        {
            const ang = giro + (i / (puntas * 2)) * VUELTA;
            const rr = (i % 2) ? r * 0.55 : r;

            g.lineTo(this.bx + (x + Math.cos(ang) * rr) * this.escala, this.by + (y + Math.sin(ang) * rr) * this.escala);
        }

        g.closePath();
        g.fill();
    }

    public anillo(x: number, y: number, rx: number, ry: number, grosor: number, color: Color, a = 1): void
    {
        const pasos = Math.max(12, Math.round(Math.max(rx, ry) * 2));

        for(let i = 0; i < pasos; i++)
        {
            const ang = (i / pasos) * VUELTA;

            this.punto(x + Math.cos(ang) * rx, y + Math.sin(ang) * ry, grosor, color, a);
        }
    }

    public luz(x: number, y: number, r: number, rgb: number[], a = 1): void
    {
        if(!this.alfa(a) || r < 1) return;

        const g = this.g, cx = this.bx + x * this.escala, cy = this.by + y * this.escala, rr = r * this.escala;
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rr);

        grad.addColorStop(0, `rgba(${ rgb[0] }, ${ rgb[1] }, ${ rgb[2] }, 1)`);
        grad.addColorStop(1, `rgba(${ rgb[0] }, ${ rgb[1] }, ${ rgb[2] }, 0)`);
        g.fillStyle = grad;
        g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }

    public sumar(si: boolean): void
    {
        this.g.globalCompositeOperation = si ? 'lighter' : 'source-over';
    }
}

interface Accion
{
    duracion: number;
    /** mientras dura, el avatar estira los dos brazos y se arrima al que tiene delante (:abrazar) */
    brazos?: boolean;
    crear: (azar: () => number) => any;
    dibujar: (l: Lienzo, t: number, d: any, lado: number) => void;
}

/** estrellitas de mareo dando vueltas sobre la cabeza */
const mareo = (l: Lienzo, t: number, desde: number, hasta: number) =>
{
    const a = tramo(t, desde, desde + 200, hasta - 300, hasta);

    for(let i = 0; i < 3; i++)
    {
        const ang = (t / 380) + (i / 3) * VUELTA;
        const delante = Math.sin(ang) > 0;

        l.dibujo(ESTRELLA, Math.cos(ang) * 13, CABEZA_Y - 26 + Math.sin(ang) * 4, delante ? 1.4 : 1, a * (delante ? 1 : 0.6));
    }
};

const ACCIONES: { [nombre: string]: Accion } = {
    // el que besa: unos labios salen de la boca y vuelan en arco hacia el otro dejando corazoncitos
    beso: {
        duracion: 2400,
        crear: azar => ({ estela: Array.from({ length: 8 }, () => ({ t0: 200 + azar() * 700, dx: (azar() * 2 - 1) * 4, sube: 10 + azar() * 14 })) }),
        dibujar: (l, t, d, lado) =>
        {
            const f = salida(entre(t, 150, 1100));
            const x = lado * f * 30, y = BOCA_Y - Math.sin(f * Math.PI) * 14;

            for(const e of d.estela)
            {
                const v = entre(t, e.t0, e.t0 + 900);

                if(v <= 0 || v >= 1) continue;

                const fx = salida(entre(e.t0, 150, 1100));

                l.dibujo(CORAZON_PEQUE, lado * fx * 30 + e.dx, BOCA_Y - Math.sin(fx * Math.PI) * 14 - v * e.sube, 1.5, 1 - v);
            }

            const latido = 1 + Math.sin(t / 70) * 0.12;

            l.dibujo(LABIOS, x, y, 1.8 * latido, tramo(t, 150, 300, 1100, 1400), lado < 0);
            l.sumar(true);
            l.luz(x, y, 14, [ 255, 90, 140 ], 0.35 * tramo(t, 150, 300, 1100, 1400));
            l.sumar(false);
        }
    },

    // el besado: marca de labios en la mejilla que late y luego revientan corazones hacia arriba
    beso_recibe: {
        duracion: 2600,
        crear: azar => ({ corazones: Array.from({ length: 10 }, (_, i) => ({ ang: -Math.PI / 2 + (azar() * 2 - 1) * 1.2, v: 16 + azar() * 14, tam: azar() < 0.4 ? 1.3 : 0.9, giro: azar() * VUELTA, t0: 1000 + i * 40 })) }),
        dibujar: (l, t, d, lado) =>
        {
            const marca = tramo(t, 900, 1000, 2000, 2500);
            const pop = 1 + Math.max(0, 1 - entre(t, 900, 1100)) * 0.6;

            l.dibujo(LABIOS, lado * 7, CABEZA_Y + 4, 1.4 * pop, marca * 0.9, lado < 0);

            for(const c of d.corazones)
            {
                const v = entre(t, c.t0, c.t0 + 1400);

                if(v <= 0 || v >= 1) continue;

                const dist = salida(v) * c.v;

                l.dibujo(c.tam > 1 ? CORAZON : CORAZON_PEQUE, Math.cos(c.ang) * dist + Math.sin(t / 160 + c.giro) * 2, CABEZA_Y - 10 + Math.sin(c.ang) * dist - v * 10, c.tam, 1 - Math.pow(v, 2));
            }
        }
    },

    // abrazo: anillos rosas que se abren desde el pecho y corazones dando vueltas alrededor
    abrazo: {
        duracion: 3200,
        brazos: true,
        crear: azar => ({ orbita: Array.from({ length: 6 }, (_, i) => ({ fase: (i / 6) * VUELTA, alto: PECHO_Y - 10 + (azar() * 2 - 1) * 10 })) }),
        dibujar: (l, t, d) =>
        {
            for(let i = 0; i < 3; i++)
            {
                const v = entre(t, 150 + i * 350, 1250 + i * 350);

                if(v <= 0 || v >= 1) continue;

                l.anillo(0, PECHO_Y, 8 + salida(v) * 26, (8 + salida(v) * 26) * 0.45, 2, ROSAS[i], (1 - v) * 0.9);
            }

            const a = tramo(t, 200, 500, 2200, 2800);

            for(const o of d.orbita)
            {
                const ang = o.fase + t / 420;
                const delante = Math.sin(ang) > 0;

                l.dibujo(CORAZON_PEQUE, Math.cos(ang) * 20, o.alto - entre(t, 1800, 2800) * 20 + Math.sin(ang) * 6, delante ? 1.6 : 1.1, a * (delante ? 1 : 0.55));
            }
        }
    },

    // bofetada: barrido blanco que cruza la cara, mano roja en la mejilla y estrellitas de mareo
    bofetada: {
        duracion: 2700,
        crear: () => ({}),
        dibujar: (l, t, d, lado) =>
        {
            const v = entre(t, 0, 260);

            if(v > 0 && v < 1)
            {
                for(let i = 0; i < 9; i++)
                {
                    const k = v - i * 0.04;

                    if(k <= 0) continue;

                    l.punto(lado * (26 - k * 52), CABEZA_Y - 4 + Math.sin(k * Math.PI) * -6, 4 - i * 0.3, '#ffffff', (1 - i / 9) * 0.9);
                }
            }

            l.sumar(true);
            l.luz(0, CABEZA_Y, 18, [ 255, 255, 255 ], 0.7 * tramo(t, 200, 240, 260, 420));
            l.sumar(false);

            const pop = 1 + Math.max(0, 1 - entre(t, 240, 420)) * 0.5;

            l.dibujo(MANO, -lado * 6, CABEZA_Y + 2, 1.1 * pop, tramo(t, 240, 300, 1900, 2500) * 0.85, lado > 0);
            mareo(l, t, 500, 2700);
        }
    },

    // puñetazo: estallido de cómic con «POW!», esquirlas que salen disparadas y mareo
    punetazo: {
        duracion: 2800,
        crear: azar => ({ esquirlas: Array.from({ length: 10 }, () => ({ ang: azar() * VUELTA, v: 20 + azar() * 22, c: azar() < 0.5 ? '#ffd23f' : '#ff7a1a' })) }),
        dibujar: (l, t, d, lado) =>
        {
            const golpe = entre(t, 0, 160);
            const x = lado * 12, y = CABEZA_Y - 6;
            const tam = salida(golpe) * 22 * (1 + Math.sin(t / 50) * 0.04);
            const a = tramo(t, 0, 80, 900, 1300);

            l.estrellaComic(x, y, tam + 4, 9, t / 900, '#1c1c1c', a);
            l.estrellaComic(x, y, tam + 2, 9, t / 900, '#ff7a1a', a);
            l.estrellaComic(x, y, tam * 0.8, 9, t / 900, '#ffd23f', a);
            l.texto('POW!', x, y - 6, 2, '#e8231d', '#ffffff', a);

            for(const e of d.esquirlas)
            {
                const v = entre(t, 60, 760);

                if(v <= 0 || v >= 1) continue;

                l.punto(x + Math.cos(e.ang) * salida(v) * e.v, y + Math.sin(e.ang) * salida(v) * e.v + v * v * 14, 3, e.c, 1 - v);
            }

            mareo(l, t, 900, 2800);
        }
    },

    // el que pega: líneas de velocidad hacia el otro
    golpe: {
        duracion: 700,
        crear: azar => ({ lineas: Array.from({ length: 5 }, () => ({ y: CABEZA_Y + 4 + (azar() * 2 - 1) * 14, largo: 10 + azar() * 10 })) }),
        dibujar: (l, t, d, lado) =>
        {
            const v = entre(t, 0, 450);

            for(const li of d.lineas)
            {
                for(let k = 0; k < li.largo; k += 2) l.punto(lado * (10 + v * 26 + k), li.y, 2, '#ffffff', (1 - v) * (1 - k / li.largo));
            }
        }
    },

    // :smoke según lo que le toque (fumar.<tipo>): ver FUMAR más abajo
    // :kill (el que dispara): saca el revólver, fogonazo con retroceso, trazo de la bala, casquillo que rebota, humo y lo guarda
    disparo: {
        duracion: 2000,
        crear: azar => ({ humo: Array.from({ length: 7 }, (_, i) => ({ t0: 400 + i * 120 + azar() * 60, dx: (azar() * 2 - 1) * 3, r: 1.5 + azar() * 1.5 })), giro: azar() < 0.5 }),
        dibujar: (l, t, d, lado) =>
        {
            const PX = 1.4;
            const sacar = salida(entre(t, 0, 220));
            const guardar = entre(t, 1500, 1900);
            const retroceso = (t >= 320) ? Math.max(0, 1 - entre(t, 320, 470)) : 0;
            const gx = lado * (10 + sacar * 8 - retroceso * 3), gy = -30 - sacar * 10 - retroceso * 2 + guardar * 8;
            const a = Math.min(sacar * 1.5, 1 - guardar);
            const bx = gx + lado * BOCA_CANON.x * PX, by = gy + BOCA_CANON.y * PX;

            // humo del cañón (detrás del arma)
            for(const h of d.humo)
            {
                const v = entre(t, h.t0, h.t0 + 1200);

                if(v <= 0 || v >= 1) continue;

                l.punto(bx + lado * 2 + h.dx + Math.sin(v * 6) * 2, by - v * 22, h.r + v * 4, '#cfd4dc', (1 - v) * 0.5);
            }

            l.dibujo(REVOLVER, gx, gy, PX, a, lado < 0);

            // fogonazo: tres capas de estrella y un resplandor
            const f = entre(t, 320, 440);

            if(f > 0 && f < 1)
            {
                const r = (1 - f) * 10 + 3;

                l.sumar(true);
                l.luz(bx + lado * 4, by, 18, [ 255, 200, 90 ], (1 - f) * 0.9);
                l.sumar(false);
                l.estrellaComic(bx + lado * 5, by, r + 2, 7, t / 60, '#ff7a1a', 1 - f);
                l.estrellaComic(bx + lado * 5, by, r, 7, t / 60 + 0.4, '#ffd23f', 1 - f);
                l.estrellaComic(bx + lado * 5, by, r * 0.45, 7, 0, '#ffffff', 1 - f);
            }

            // trazo de la bala hasta el otro
            const b = entre(t, 320, 380), bf = entre(t, 380, 560);

            if(b > 0 && bf < 1)
            {
                for(let k = 0; k <= 24; k++)
                {
                    const q = k / 24;

                    if(q > b) break;

                    l.punto(bx + lado * (4 + q * 26), by + q * 6, 1.6, q > b - 0.15 ? '#ffffff' : '#ffe08a', (1 - bf) * (0.4 + q * 0.6));
                }
            }

            // casquillo: sale hacia atrás y arriba, gira y rebota en el suelo
            const c = entre(t, 340, 1300);

            if(c > 0 && c < 1)
            {
                const tt = c * 0.96;
                let cy = gy - 6 - 120 * tt + 180 * tt * tt;
                const cx = gx - lado * (2 + tt * 34);

                if(cy > -2) cy = -2 - Math.abs(Math.sin(tt * 18)) * 6 * (1 - tt);

                const vertical = (Math.floor(t / 60) % 2 === 0) !== d.giro;

                l.punto(cx, cy, vertical ? 1.2 : 2.2, '#d4a017', 1 - entre(t, 1100, 1300));
                l.punto(cx + (vertical ? 0 : lado * 0.8), cy + (vertical ? 0.8 : 0), 1, '#fff1a8', 1 - entre(t, 1100, 1300));
            }
        }
    },

    // :kill con la pistola del efecto 164 (p = rotación del keko): fogonazo y bala en la punta del cañón, chispitas y el humito
    tiro: {
        duracion: 2400,
        crear: azar => ({
            humo: Array.from({ length: 9 }, (_, i) => ({ t0: 80 + i * 110 + azar() * 60, dx: (azar() * 2 - 1) * 2.5, r: 1.6 + azar() * 1.4, fase: azar() * VUELTA })),
            chispas: Array.from({ length: 6 }, () => ({ ang: (azar() * 2 - 1) * 0.9, v: 6 + azar() * 8 }))
        }),
        dibujar: (l, t, d, rot) =>
        {
            const c = CANON_164[rot] || CANON_164[2], r = RUMBO[rot] || RUMBO[2];

            for(const h of d.humo)
            {
                const v = entre(t, h.t0, h.t0 + 1400);

                if(v <= 0 || v >= 1) continue;

                l.punto(c.x + r.x * 3 + h.dx + Math.sin(v * 5 + h.fase) * 3, c.y - 2 - v * 26, h.r + v * 4.5, '#d3d8df', (1 - v) * 0.55);
            }

            const f = entre(t, 0, 130);

            if(f < 1)
            {
                const fx = c.x + r.x * 4, fy = c.y + r.y * 4, tam = (1 - f) * 8 + 2;

                l.sumar(true);
                l.luz(fx, fy, 16, [ 255, 200, 90 ], (1 - f) * 0.9);
                l.sumar(false);
                l.estrellaComic(fx, fy, tam + 2, 7, t / 50, '#ff7a1a', 1 - f);
                l.estrellaComic(fx, fy, tam, 7, t / 50 + 0.4, '#ffd23f', 1 - f);
                l.estrellaComic(fx, fy, tam * 0.45, 7, 0, '#ffffff', 1 - f);
            }

            const b = entre(t, 0, 70), bf = entre(t, 70, 260);

            if(bf < 1)
            {
                for(let k = 0; k <= 20; k++)
                {
                    const q = k / 20;

                    if(q > b) break;

                    l.punto(c.x + r.x * (5 + q * 28), c.y + r.y * (5 + q * 28), 1.5, q > b - 0.2 ? '#ffffff' : '#ffe08a', (1 - bf) * (0.4 + q * 0.6));
                }
            }

            for(const sp of d.chispas)
            {
                const v = entre(t, 0, 350);

                if(v <= 0 || v >= 1) continue;

                const ang = Math.atan2(r.y, r.x) + sp.ang;

                l.punto(c.x + Math.cos(ang) * (4 + salida(v) * sp.v), c.y + Math.sin(ang) * (4 + salida(v) * sp.v) + v * v * 5, 1.4, '#ffd23f', 1 - v);
            }
        }
    },

    // :kill (el que recibe): impacto con destello y chispas al llegar la bala, «K.O.» de cómic y el alma que sube
    muerte: {
        duracion: 3500,
        crear: azar => ({ chispas: Array.from({ length: 12 }, () => ({ ang: azar() * VUELTA, v: 12 + azar() * 16, c: [ '#ffffff', '#ffd23f', '#ff7a1a' ][Math.floor(azar() * 3)] })) }),
        dibujar: (l, t, d, lado) =>
        {
            const ix = lado * 4, iy = PECHO_Y - 6;
            const golpe = entre(t, 330, 430);

            if(golpe > 0 && golpe < 1)
            {
                l.sumar(true);
                l.luz(ix, iy, 20, [ 255, 255, 255 ], (1 - golpe) * 0.9);
                l.sumar(false);
            }

            const onda = entre(t, 330, 650);

            if(onda > 0 && onda < 1) l.anillo(ix, iy, 4 + salida(onda) * 18, (4 + salida(onda) * 18) * 0.6, 1.6, '#ffffff', (1 - onda) * 0.8);

            for(const ch of d.chispas)
            {
                const v = entre(t, 330, 900);

                if(v <= 0 || v >= 1) continue;

                l.punto(ix + Math.cos(ch.ang) * salida(v) * ch.v, iy + Math.sin(ch.ang) * salida(v) * ch.v + v * v * 16, 2, ch.c, 1 - v);
            }

            // «K.O.»: salta grande y se asienta
            const ko = entre(t, 420, 620);

            if(ko > 0)
            {
                const escala = 2.8 + (1 - salida(ko)) * 1.6;

                l.texto('K.O.', 0, CABEZA_Y - 34 - Math.sin(ko * Math.PI) * 6, escala, '#e8231d', '#ffffff', Math.min(ko * 3, 1 - entre(t, 1600, 2000)));
            }

            const alma = entre(t, 1300, 3500);

            if(alma > 0) l.dibujo(FANTASMA, Math.sin(alma * 9) * 6, PECHO_Y - 4 - alma * 70, 1.6, Math.min(entre(t, 1300, 1600), 1 - alma) * 0.9);
        }
    },

    // fumar: brasa que brilla en la boca, bocanadas que suben y anillos de humo que se abren
    humo: {
        duracion: 3400,
        crear: azar => ({
            bocanadas: Array.from({ length: 14 }, (_, i) => ({ t0: 250 + i * 150 + azar() * 80, r: 3 + azar() * 3, dx: 6 + azar() * 10, c: HUMOS[Math.floor(azar() * HUMOS.length)], fase: azar() * VUELTA })),
            anillos: [ 900, 1600, 2300 ].map(t0 => ({ t0, dx: 4 + azar() * 6 }))
        }),
        dibujar: (l, t, d, lado) =>
        {
            const bx = lado * 6, by = BOCA_Y;
            const brasa = tramo(t, 0, 150, 3000, 3400) * (0.7 + Math.sin(t / 110) * 0.3);

            l.sumar(true);
            l.luz(bx, by, 5, [ 255, 120, 30 ], brasa);
            l.sumar(false);
            l.punto(bx, by, 2, '#ffb347', brasa);

            for(const b of d.bocanadas)
            {
                const v = entre(t, b.t0, b.t0 + 1500);

                if(v <= 0 || v >= 1) continue;

                const r = b.r + 2 + v * 9;

                l.punto(bx + lado * b.dx * v + Math.sin(v * 5 + b.fase) * 4, by - 4 - v * 46, r, b.c, (1 - v) * 0.68);
            }

            for(const an of d.anillos)
            {
                const v = entre(t, an.t0, an.t0 + 1300);

                if(v <= 0 || v >= 1) continue;

                const r = 3 + salida(v) * 10;

                l.anillo(bx + lado * an.dx * v, by - 10 - v * 40, r, r * 0.5, 2, '#e3e7ee', (1 - v) * 0.8);
            }
        }
    },

    // :sex — fuegos artificiales de corazones: cohetes que suben desde los pies y revientan en corazones
    fuegos: {
        duracion: 3600,
        crear: azar => ({
            cohetes: Array.from({ length: 4 }, (_, i) => ({ t0: i * 520 + azar() * 120, x: (azar() * 2 - 1) * 22, alto: 105 + azar() * 25, c: [ '#ff2f5c', '#ff3b6b', '#ff5c86', '#ff1f6e' ][i % 4], chispas: Array.from({ length: 20 }, (_, k) => ({ ang: (k / 20) * VUELTA, v: 18 + azar() * 4 })) })),
            lluvia: Array.from({ length: 10 }, () => ({ t0: 600 + azar() * 2400, x: (azar() * 2 - 1) * 28 }))
        }),
        dibujar: (l, t, d) =>
        {
            for(const c of d.cohetes)
            {
                const sube = entre(t, c.t0, c.t0 + 500);
                const revienta = entre(t, c.t0 + 500, c.t0 + 1500);

                if(sube > 0 && sube < 1)
                {
                    const y = -salida(sube) * c.alto;

                    for(let k = 0; k < 5; k++) l.punto(c.x, y + k * 3, 2.5 - k * 0.4, '#ffe0e9', 1 - k / 5);
                }

                if(revienta > 0 && revienta < 1)
                {
                    const cy = -c.alto;

                    l.sumar(true);
                    l.luz(c.x, cy, 22, [ 255, 80, 130 ], (1 - revienta) * 0.45);
                    l.sumar(false);

                    // las chispas dibujan un corazón: x = 16 sen³, y = -(13 cos - 5 cos2 - 2 cos3 - cos4)
                    for(const s of c.chispas)
                    {
                        const u = s.ang;
                        const hx = 16 * Math.pow(Math.sin(u), 3), hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
                        const k = salida(revienta) * (s.v / 15);

                        l.punto(c.x + hx * k, cy + hy * k + revienta * revienta * 12, 4, c.c, Math.min(1, (1 - revienta) * 1.5));
                        l.punto(c.x + hx * k, cy + hy * k + revienta * revienta * 12, 1.5, '#ffe3ec', (1 - revienta));
                    }
                }
            }

            for(const g of d.lluvia)
            {
                const v = entre(t, g.t0, g.t0 + 900);

                if(v <= 0 || v >= 1) continue;

                l.dibujo(CORAZON_PEQUE, g.x + Math.sin(v * 6) * 3, -120 + v * 70, 1.2, 1 - v);
            }
        }
    },

    // :sex (el otro) — un corazón grande que late entre los dos y suelta ondas
    latido: {
        duracion: 3600,
        crear: () => ({}),
        dibujar: (l, t, d, lado) =>
        {
            const a = tramo(t, 0, 300, 3000, 3600);
            const pulso = Math.pow(Math.max(0, Math.sin(t / 160)), 6);
            const x = lado * 14, y = CABEZA_Y - 26;

            for(let i = 0; i < 3; i++)
            {
                const v = ((t / 900) + i / 3) % 1;

                l.anillo(x, y, 6 + v * 20, (6 + v * 20) * 0.8, 1.5, '#ff6f91', a * (1 - v) * 0.7);
            }

            l.sumar(true);
            l.luz(x, y, 16, [ 255, 60, 110 ], a * (0.3 + pulso * 0.4));
            l.sumar(false);
            l.dibujo(CORAZON, x, y, 2 + pulso * 0.6, a);
        }
    }
};

// :smoke — fuma de verdad: se lleva a la boca lo que le ha tocado, lo enciende, da dos caladas (la brasa se aviva) y echa
// el humo hacia donde mira. Cada cosa con su humo y su efecto. «lado» = hacia dónde mira.
interface Fumable { objeto: Dibujo, px: number, largo: number, humo: string[], denso: number, anillos: boolean, extra: string }

const FUMABLES: { [tipo: string]: Fumable } = {
    tabaco: { objeto: CIGARRILLO, px: 1, largo: 10, humo: [ '#c7ccd6', '#d9dde4', '#b3b9c4' ], denso: 0.8, anillos: true, extra: 'tos' },
    puro: { objeto: PURO, px: 1.1, largo: 11, humo: [ '#b9bec8', '#a5acb8', '#cfd4dc' ], denso: 1.4, anillos: true, extra: '' },
    porro: { objeto: PORRO('#f2f0e6'), px: 1, largo: 10, humo: [ '#b9c4b0', '#c9d2c1', '#aab6a2' ], denso: 1.1, anillos: false, extra: 'calma' },
    marihuana: { objeto: PORRO('#f2f0e6'), px: 1, largo: 10, humo: [ '#9fc48e', '#b5d4a6', '#8ab27a' ], denso: 1.2, anillos: false, extra: 'hojas' },
    chocolate: { objeto: PORRO('#d9c3a5'), px: 1, largo: 10, humo: [ '#b8a48e', '#a8927a', '#c9b8a3' ], denso: 1.2, anillos: false, extra: 'remolino' },
    polen: { objeto: PORRO('#f2f0e6'), px: 1, largo: 10, humo: [ '#e6d98a', '#efe4a6', '#d8c86e' ], denso: 1, anillos: false, extra: 'estornudo' }
};

const fumar = (f: Fumable): Accion => ({
    duracion: 5600,
    crear: azar => ({
        caladas: [ 1200, 3300 ].map(t0 => ({ t0, puffs: Array.from({ length: Math.round(7 * f.denso) }, (_, i) => ({ t0: t0 + i * 90 + azar() * 50, sube: 22 + azar() * 16, va: 14 + azar() * 14, r: 2 + azar() * 2, c: f.humo[Math.floor(azar() * f.humo.length)], fase: azar() * VUELTA })) })),
        hilo: Array.from({ length: 10 }, (_, i) => ({ t0: 400 + i * 480 + azar() * 120, fase: azar() * VUELTA })),
        hojas: Array.from({ length: 7 }, () => ({ t0: 3400 + azar() * 1600, x: (azar() * 2 - 1) * 18, fase: azar() * VUELTA })),
        motas: Array.from({ length: 14 }, () => ({ t0: 1200 + azar() * 3600, x: (azar() * 2 - 1) * 16, y: -20 - azar() * 50 }))
    }),
    dibujar: (l, t, d, lado) =>
    {
        const bx = lado * 4, by = BOCA_Y + 1;
        const a = tramo(t, 0, 350, 5000, 5500);
        const largoPx = f.largo * f.px;
        const punta = { x: bx + lado * largoPx, y: by };

        // hilo de humo que sale siempre de la punta encendida
        for(const h of d.hilo)
        {
            const v = entre(t, h.t0, h.t0 + 1300);

            if(v <= 0 || v >= 1) continue;

            l.punto(punta.x + Math.sin(v * 7 + h.fase) * 2, punta.y - 2 - v * 22, 1 + v * 2, f.humo[0], (1 - v) * 0.45 * a);
        }

        // lo que fuma, en la boca
        l.dibujo(f.objeto, bx + lado * largoPx / 2, by, f.px, a, lado < 0);

        // brasa: se enciende al principio y se aviva en cada calada
        const calando = Math.max(tramo(t, 500, 800, 1000, 1200), tramo(t, 2600, 2900, 3100, 3300));
        const brasa = a * (0.45 + calando * 0.55 + Math.sin(t / 120) * 0.08);

        l.sumar(true);
        l.luz(punta.x, punta.y, 4 + calando * 3, [ 255, 110, 30 ], brasa);
        l.sumar(false);

        // llama del mechero al encender
        const llama = tramo(t, 250, 330, 520, 640);

        if(llama > 0)
        {
            l.sumar(true);
            l.luz(punta.x + lado * 2, punta.y + 1, 6, [ 255, 190, 60 ], llama);
            l.sumar(false);
            l.punto(punta.x + lado * 2, punta.y - 1, 2, '#ffd23f', llama);
            l.punto(punta.x + lado * 2, punta.y - 3, 1.4, '#fff3b0', llama);
        }

        // echar el humo: bocanadas que salen de la boca hacia donde mira y suben
        for(const c of d.caladas)
        {
            for(const p of c.puffs)
            {
                const v = entre(t, p.t0, p.t0 + 1500);

                if(v <= 0 || v >= 1) continue;

                l.punto(bx + lado * (2 + salida(v) * p.va) + Math.sin(v * 5 + p.fase) * 2, by - 1 - v * p.sube, p.r + v * 6 * f.denso, p.c, (1 - v) * 0.6);
            }

            if(!f.anillos) continue;

            const r0 = entre(t, c.t0 + 300, c.t0 + 1700);

            if(r0 > 0 && r0 < 1)
            {
                const r = 2.5 + salida(r0) * 9;

                l.anillo(bx + lado * (6 + r0 * 16), by - 6 - r0 * 30, r, r * 0.5, 1.6, '#e3e7ee', (1 - r0) * 0.85);
            }
        }

        // el efecto de cada cosa
        switch(f.extra)
        {
            case 'tos':
            {
                const k = entre(t, 4100, 4300);

                if(k > 0) l.texto('COF COF', lado * 6, CABEZA_Y - 30 - Math.sin(t / 60) * 1.5, 1.6, '#7a7f88', '#ffffff', Math.min(k, 1 - entre(t, 5000, 5400)));
                break;
            }
            case 'calma':
            {
                // nube tranquila alrededor de la cabeza que respira despacio
                const n = tramo(t, 3600, 4200, 5000, 5600);

                for(let i = 0; i < 8; i++)
                {
                    const ang = (i / 8) * VUELTA + t / 1600;

                    l.punto(Math.cos(ang) * 14, CABEZA_Y - 6 + Math.sin(ang) * 5, 5 + Math.sin(t / 400 + i) * 1.5, f.humo[i % 3], n * 0.4);
                }
                break;
            }
            case 'hojas':
            {
                for(const h of d.hojas)
                {
                    const v = entre(t, h.t0, h.t0 + 1500);

                    if(v <= 0 || v >= 1) continue;

                    l.dibujo(HOJA, h.x + Math.sin(v * 6 + h.fase) * 4, CABEZA_Y - 10 - v * 30, 1, 1 - v);
                }
                break;
            }
            case 'remolino':
            {
                const v = tramo(t, 3600, 4100, 5000, 5600);

                for(let i = 0; i < 18; i++)
                {
                    const k = i / 18, ang = k * VUELTA * 2 + t / 300;

                    l.punto(Math.cos(ang) * (4 + k * 14), PECHO_Y - 20 - k * 22 + Math.sin(ang) * 3, 2.5, f.humo[i % 3], v * (1 - k) * 0.7);
                }
                break;
            }
            case 'estornudo':
            {
                const k = entre(t, 4200, 4320);

                if(k > 0)
                {
                    l.texto('¡ACHIS!', lado * 4, CABEZA_Y - 30, 1.7, '#d4a017', '#ffffff', Math.min(k, 1 - entre(t, 5000, 5400)));

                    for(let i = 0; i < 10; i++)
                    {
                        const v = entre(t, 4200, 4900), ang = -0.6 + (i / 10) * 1.2;

                        if(v > 0 && v < 1) l.punto(bx + lado * Math.cos(ang) * salida(v) * 22, by + Math.sin(ang) * salida(v) * 10, 2, '#efe4a6', 1 - v);
                    }
                }
                break;
            }
        }

        // motas brillantes del polen
        if(f.extra === 'estornudo')
        {
            for(const m of d.motas)
            {
                const v = entre(t, m.t0, m.t0 + 900);

                if(v <= 0 || v >= 1) continue;

                l.punto(m.x + lado * 6, m.y + CABEZA_Y + 40 - v * 10, 1.5, '#fff59d', Math.sin(v * Math.PI));
            }
        }
    }
});

for(const tipo of Object.keys(FUMABLES)) ACCIONES['fumar.' + tipo] = fumar(FUMABLES[tipo]);

export class AccionMotor
{
    /** «nombre:lado» → la animación y el lado (-1 / 1), o null si no se conoce */
    public static efecto(spec: string): { accion: Accion, lado: number }
    {
        if(!spec) return null;

        const [ nombre, lado ] = spec.split(':');
        const accion = ACCIONES[nombre];

        if(!accion) return null;

        const n = parseInt(lado, 10);

        // «lado» (-1 / 1) en casi todas; en «tiro» es la rotación del keko (0-7)
        return { accion, lado: (nombre === 'tiro') ? (isNaN(n) ? 2 : n) : ((lado === '-1') ? -1 : 1) };
    }

    public static datos(accion: Accion, semilla: number): any
    {
        let s = (semilla >>> 0) || 1;

        const azar = () =>
        {
            s = (s * 1664525 + 1013904223) >>> 0;

            return s / 4294967296;
        };

        return accion.crear(azar);
    }

    public static pintar(accion: Accion, datos: any, lado: number, ctx: CanvasRenderingContext2D, x: number, y: number, escala: number, t: number): void
    {
        ctx.imageSmoothingEnabled = false;

        try
        {
            accion.dibujar(new Lienzo(ctx, x, y, escala), t, datos, lado);
        }
        finally
        {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}
