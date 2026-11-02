/**
 * Animaciones de los comandos de interacción (:besar, :hug, :slap, :punch, :kill, :smoke, :sex): pixel art dibujado a
 * mano en un lienzo delante del keko (AccionAddition). Llegan por el paquete del Splash con la fase «accion» y el spec
 * «nombre:lado», donde lado (-1 / 1) es hacia qué lado de la pantalla está el otro avatar.
 *
 * Coordenadas en píxeles del keko a escala 64: (0, 0) son los pies y la y negativa va hacia arriba.
 */

const VUELTA = Math.PI * 2;
const CABEZA_Y = -86;
const BOCA_Y = -76;
const PECHO_Y = -50;

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

/** letras de 3x5 para los rótulos de cómic */
const LETRAS: { [l: string]: string[] } = {
    P: [ 'XX.', 'X.X', 'XX.', 'X..', 'X..' ],
    O: [ '.X.', 'X.X', 'X.X', 'X.X', '.X.' ],
    W: [ 'X.X', 'X.X', 'X.X', 'XXX', 'X.X' ],
    '!': [ 'X', 'X', 'X', '.', 'X' ],
    Z: [ 'XXX', '..X', '.X.', 'X..', 'XXX' ]
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

        l.dibujo(ESTRELLA, Math.cos(ang) * 13, CABEZA_Y - 18 + Math.sin(ang) * 4, delante ? 1.4 : 1, a * (delante ? 1 : 0.6));
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
            const x = lado * f * 48, y = BOCA_Y - Math.sin(f * Math.PI) * 22;

            for(const e of d.estela)
            {
                const v = entre(t, e.t0, e.t0 + 900);

                if(v <= 0 || v >= 1) continue;

                const fx = salida(entre(e.t0, 150, 1100));

                l.dibujo(CORAZON_PEQUE, lado * fx * 48 + e.dx, BOCA_Y - Math.sin(fx * Math.PI) * 22 - v * e.sube, 1.5, 1 - v);
            }

            const latido = 1 + Math.sin(t / 70) * 0.12;

            l.dibujo(LABIOS, x, y, 2.3 * latido, tramo(t, 150, 300, 1100, 1400), lado < 0);
            l.sumar(true);
            l.luz(x, y, 14, [ 255, 90, 140 ], 0.35 * tramo(t, 150, 300, 1100, 1400));
            l.sumar(false);
        }
    },

    // el besado: marca de labios en la mejilla que late y luego revientan corazones hacia arriba
    beso_recibe: {
        duracion: 2600,
        crear: azar => ({ corazones: Array.from({ length: 10 }, (_, i) => ({ ang: -Math.PI / 2 + (azar() * 2 - 1) * 1.2, v: 26 + azar() * 22, tam: azar() < 0.4 ? 1.3 : 0.9, giro: azar() * VUELTA, t0: 1000 + i * 40 })) }),
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
        duracion: 2800,
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

    // muerte: tajo rojo en diagonal, calavera que salta y el alma que sube haciendo eses
    muerte: {
        duracion: 3600,
        crear: () => ({}),
        dibujar: (l, t, d, lado) =>
        {
            const v = entre(t, 0, 220);

            for(let i = 0; i < 22; i++)
            {
                const k = i / 22;

                if(k > v) break;

                l.punto(lado * (-18 + k * 36), PECHO_Y - 22 + k * 30, 3.2 - k * 1.4, k < v - 0.15 ? '#ff2b2b' : '#ffffff', tramo(t, 0, 40, 500, 900));
            }

            l.sumar(true);
            l.luz(0, PECHO_Y - 8, 24, [ 255, 40, 40 ], 0.45 * tramo(t, 150, 220, 300, 700));
            l.sumar(false);

            const salto = entre(t, 250, 650);

            l.dibujo(CALAVERA, 0, CABEZA_Y - 16 - Math.sin(salto * Math.PI) * 10, 1.8, tramo(t, 250, 350, 1300, 1700));

            const alma = entre(t, 1200, 3600);

            if(alma > 0) l.dibujo(FANTASMA, Math.sin(alma * 9) * 6, PECHO_Y - 10 - alma * 70, 1.6, Math.min(entre(t, 1200, 1500), 1 - alma) * 0.9);
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

export class AccionMotor
{
    /** «nombre:lado» → la animación y el lado (-1 / 1), o null si no se conoce */
    public static efecto(spec: string): { accion: Accion, lado: number }
    {
        if(!spec) return null;

        const [ nombre, lado ] = spec.split(':');
        const accion = ACCIONES[nombre];

        if(!accion) return null;

        return { accion, lado: (lado === '-1') ? -1 : 1 };
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
