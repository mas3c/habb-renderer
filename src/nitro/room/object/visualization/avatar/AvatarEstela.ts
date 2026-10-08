import { AvatarAura } from './AvatarAura';

/**
 * Estela al andar (idea propia de Habb): al caminar, el keko suelta partículas en las baldosas por las que
 * pasa y se desvanecen en ~1 s. Se describe con «efecto|color» (FIGURE_ESTELA; vacía = ninguna):
 *   efecto: huellas, chispas, burbujas, humo, petalos, hojas, nieve, corazones, estrellas, notas, fuego,
 *           hielo, rayos, arcoiris, galaxia, portal, fenix, monedas, mariposas, baldosas, codigo,
 *           y de Halloween: murcielagos, fantasmas, calabazas, fatuo, caramelos
 *   color:  0xRRGGBB, una paleta animada de las auras (rainbow, gold, fire…) o vacío (los suyos).
 *
 * Es solo dibujo: guarda las partículas en coordenadas de la sala (baldosas) y las pinta en un lienzo 2D
 * relativo a los pies del avatar con la proyección isométrica fija de Habbo. Los dibujos se hacen a la
 * resolución del avatar (1 píxel = 1 píxel a escala 64), con contorno oscuro y sombreado de tres tonos como
 * los sprites de Habbo (ver sprite()), y se guardan hechos en una caché. La usan EstelaAddition (sala)
 * y la vista previa del catálogo, así que se ven igual.
 */
interface Particula
{
    x: number;
    y: number;
    z: number;
    t0: number;
    s: number; // azar fijo de la partícula (0-1)
    lado: number; // huellas: pie izquierdo / derecho
    n: number; // número de orden (el arcoíris va cambiando de color)
    mx: number; // hacia dónde andaba al soltarla (la cinta del arcoíris va de través)
    my: number;
}

interface Efecto
{
    vida: number; // ms que dura cada partícula
    paso: number; // cada cuántas baldosas recorridas suelta
    cuantas: number; // cuántas suelta cada vez
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
    fuego: { vida: 800, paso: 0.16, cuantas: 1 },
    hielo: { vida: 1300, paso: 0.4, cuantas: 1 },
    rayos: { vida: 450, paso: 0.4, cuantas: 1 },
    arcoiris: { vida: 700, paso: 0.06, cuantas: 1 },
    galaxia: { vida: 1100, paso: 0.25, cuantas: 2 },
    portal: { vida: 900, paso: 0.55, cuantas: 1 },
    fenix: { vida: 900, paso: 0.14, cuantas: 1 },
    monedas: { vida: 900, paso: 0.3, cuantas: 1 },
    mariposas: { vida: 1500, paso: 0.45, cuantas: 1 },
    baldosas: { vida: 1300, paso: 1, cuantas: 1 },
    codigo: { vida: 1000, paso: 0.3, cuantas: 1 },
    murcielagos: { vida: 1300, paso: 0.45, cuantas: 1 },
    fantasmas: { vida: 1600, paso: 0.6, cuantas: 1 },
    calabazas: { vida: 1500, paso: 0.8, cuantas: 1 },
    fatuo: { vida: 900, paso: 0.14, cuantas: 1 },
    caramelos: { vida: 900, paso: 0.3, cuantas: 1 }
};

const MAX_PARTICULAS = 140;
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
    private _baldosa: string = null;
    private _ultimaT = 0;

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
            this._baldosa = `${ Math.round(x) },${ Math.round(y) }`;

            return;
        }

        // la pista de baile enciende cada baldosa en la que entra, entera y centrada
        if(this.efecto === 'baldosas')
        {
            const baldosa = `${ Math.round(x) },${ Math.round(y) }`;
            const salto = Math.hypot((x - this._ultima.x), (y - this._ultima.y));

            this._ultima = { x, y };

            if((baldosa === this._baldosa) || (salto > 2.5))
            {
                this._baldosa = baldosa; return;
            }

            this._particulas.push({ x: Math.round(x), y: Math.round(y), z, t0: ahora, s: Math.random(), lado: 1, n: this._orden++, mx: 0, my: 0 });
            this._baldosa = baldosa;

            return;
        }

        const d = Math.hypot((x - this._ultima.x), (y - this._ultima.y));

        if(d > 2.5)
        {
            this._ultima = { x, y };
            this._ultimaT = ahora;

            return;
        }

        if(d < this._efecto.paso) return;

        if(this._ultimaT === 0) this._ultimaT = ahora;

        // la cinta del arcoíris es continua: rellena el tramo desde la última muestra (en la sala la posición
        // no llega en cada fotograma y quedaban franjas sueltas)
        if(this.efecto === 'arcoiris')
        {
            const trozos = Math.min(40, Math.floor(d / this._efecto.paso));
            const mx = (x - this._ultima.x), my = (y - this._ultima.y);

            for(let i = 1; i <= trozos; i++)
            {
                const f = (i / trozos);

                this._particulas.push({ x: this._ultima.x + (mx * f), y: this._ultima.y + (my * f), z, t0: this._ultimaT + ((ahora - this._ultimaT) * f), s: Math.random(), lado: 1, n: this._orden++, mx, my });
            }

            this._ultima = { x, y };
            this._ultimaT = ahora;

            if(this._particulas.length > MAX_PARTICULAS) this._particulas.splice(0, (this._particulas.length - MAX_PARTICULAS));

            return;
        }

        for(let i = 0; i < this._efecto.cuantas; i++)
        {
            this._particulas.push({ x, y, z, t0: ahora, s: Math.random(), lado: this._lado, n: this._orden++, mx: (x - this._ultima.x), my: (y - this._ultima.y) });
        }

        this._lado = -this._lado;
        this._ultima = { x, y };
        this._ultimaT = ahora;

        if(this._particulas.length > MAX_PARTICULAS) this._particulas.splice(0, (this._particulas.length - MAX_PARTICULAS));
    }

    /**
     * Pinta las partículas vivas en ctx con los pies del avatar en (cx, cy) y el avatar en (ax, ay, az) de la
     * sala. escala: la de la sala (64 normal, 32 alejada).
     */
    public pintar(ctx: CanvasRenderingContext2D, cx: number, cy: number, ax: number, ay: number, az: number, ahora: number, escala: number): void
    {
        const u = (escala / 64);
        const medio = (escala / 2), cuarto = (escala / 4);

        ctx.imageSmoothingEnabled = false;

        for(const p of this._particulas)
        {
            const a = Math.min(1, Math.max(0, (ahora - p.t0) / (this._efecto.vida * DURA)));
            const dx = (p.x - ax), dy = (p.y - ay);
            const sx = cx + ((dx - dy) * medio);
            const sy = cy + ((dx + dy) * cuarto) - ((p.z - az) * medio);

            this.particula(ctx, p, a, Math.round(sx), Math.round(sy), u, ahora);
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    /**
     * La miniatura de la casilla del catálogo: unas partículas de muestra a su tamaño de verdad (sin encoger), una
     * al lado de otra y centradas, como una ficha del efecto. Cabe en ancho x alto; si una pieza no cabe (la
     * baldosa de la pista de baile) se reduce solo esa.
     */
    public static miniatura(spec: string, ancho = 60, alto = 26): HTMLCanvasElement
    {
        const lienzo = document.createElement('canvas');

        lienzo.width = ancho;
        lienzo.height = alto;

        const estela = AvatarEstela.crear(spec);

        if(!estela) return lienzo;

        const efecto = estela.efecto;
        const pieza = (pintar: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement =>
        {
            const c = document.createElement('canvas');

            c.width = 200;
            c.height = 200;

            const ctx = c.getContext('2d');

            // sin halos: en una casilla pequeña el resplandor se recorta en cuadrado
            Object.defineProperty(ctx, 'shadowBlur', { get: () => 0, set: () => undefined });
            ctx.imageSmoothingEnabled = false;
            pintar(ctx);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            return recortar(c);
        };
        const una = (a: number, s: number, n: number, lado = 1, mx = 1, my = -1) => pieza(ctx => estela.particula(ctx, { x: 0, y: 0, z: 0, t0: 0, s, lado, n, mx, my }, a, 100, 150, 1, 0));

        let piezas: HTMLCanvasElement[];

        if(efecto === 'arcoiris')
        {
            // la cinta: muchas partículas seguidas, la más vieja a la izquierda
            piezas = [ pieza(ctx =>
            {
                for(let i = 0; i < 26; i++) estela.particula(ctx, { x: 0, y: 0, z: 0, t0: 0, s: 0.5, lado: 1, n: i, mx: 1, my: -1 }, (0.5 - (i / 52)), 60 + (i * 2), 150, 1, 0);
            }) ];
        }
        else if(efecto === 'huellas')
        {
            // pisadas vistas desde arriba, izquierda y derecha alternas
            const color = hex(estela.color({ x: 0, y: 0, z: 0, t0: 0, s: 0.5, lado: 1, n: 0, mx: 0, my: 0 }, 0, 0xFFFFFF));

            piezas = [ pieza(ctx =>
            {
                ctx.fillStyle = color;
                for(let i = 0; i < 3; i++)
                {
                    const cx = 70 + (i * 13), cy = 140 + ((i % 2) ? -5 : 5), lado = (i % 2) ? 1 : -1;

                    ctx.beginPath();
                    ctx.ellipse(cx, cy, 3.4, 5, lado * 0.15, 0, Math.PI * 2);
                    ctx.ellipse(cx + (lado * 0.6), cy + 7, 2.6, 2.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    for(let d = 0; d < 4; d++)
                    {
                        ctx.beginPath();
                        ctx.arc(cx - 3 + (d * 2) - (lado * 0.5), cy - 6.5 + (Math.abs(d - 1.5) * 0.8), 1.05, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }) ];
        }
        else if(efecto === 'baldosas') piezas = [ una(0.1, 0.5, 0), una(0.1, 0.5, 1) ];
        else if(efecto === 'portal') piezas = [ una(0.25, 0.5, 0) ];
        else if(efecto === 'rayos') piezas = [ una(0.1, 0.35, 0), una(0.1, 0.62, 1) ];
        else if((efecto === 'fuego') || (efecto === 'fatuo')) piezas = [ una(0.4, 0.3, 1), una(0.02, 0.5, 2), una(0.22, 0.4, 4) ];
        else if(efecto === 'fenix') piezas = [ una(0.02, 0.5, 1), una(0.2, 0.5, 0), una(0.3, 0.3, 2) ];
        else piezas = [ una(0.05, 0.2, 0, -1), una(0.15, 0.55, 1), una(0.1, 0.8, 2, -1) ];

        piezas = piezas.filter(p => (p.width > 1));

        // si no caben todas a lo ancho, las que sobren fuera
        const hueco = 3;

        while((piezas.length > 1) && ((piezas.reduce((t, p) => (t + p.width), 0) + (hueco * (piezas.length - 1))) > ancho)) piezas.pop();

        const ctx = lienzo.getContext('2d');
        const total = (piezas.reduce((t, p) => (t + Math.min(p.width, ancho)), 0) + (hueco * (piezas.length - 1)));
        let x = Math.round((ancho - total) / 2);

        ctx.imageSmoothingEnabled = false;

        for(const p of piezas)
        {
            const f = Math.min(1, (ancho / p.width), (alto / p.height));
            const w = Math.round(p.width * f), h = Math.round(p.height * f);

            ctx.imageSmoothingEnabled = (f < 1);
            ctx.drawImage(p, x, Math.round((alto - h) / 2), w, h);
            x += (w + hueco);
        }

        contornear(lienzo);

        return lienzo;
    }

    private color(p: Particula, ahora: number, porDefecto: number): number
    {
        if(this._paleta) return AvatarAura.calcularColor(this._paleta, (ahora * 0.0018) + (p.s * 3));

        return (this._color ?? porDefecto);
    }

    /**
     * Una partícula con edad a (0 recién soltada, 1 a punto de desaparecer) en (x, y) de pantalla. u: escala
     * de la sala / 64; los tamaños y recorridos van en píxeles a escala 64.
     */
    private particula(ctx: CanvasRenderingContext2D, p: Particula, a: number, x: number, y: number, u: number, ahora: number): void
    {
        const desvanece = (1 - a);
        const apaga = (desde: number) => ((a > desde) ? ((1 - a) / (1 - desde)) : 1);
        const vaiven = Math.sin((a * 6) + (p.s * 6)) * 9 * u;
        const azar = (p.s - 0.5) * 42 * u;
        const t = (n: number) => Math.max(3, Math.round(n * u));
        const giro = (vueltas: number) => Math.floor((((a * vueltas) + p.s) % 1) * 16) / 16 * Math.PI * 2;

        switch(this.efecto)
        {
            case 'huellas': {
                // aplastadas sobre el suelo y mirando hacia donde anda
                const ang = Math.atan2((p.mx + p.my), (p.mx - p.my) || 0.0001);
                const lado = p.lado * 3.5 * u;

                ctx.globalAlpha = 0.75 * apaga(0.4);
                ctx.fillStyle = hex(this.color(p, ahora, 0xFFFFFF));
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(1, 0.62);
                ctx.rotate(ang);
                ctx.translate(0, lado);
                ctx.beginPath();
                ctx.ellipse(0.5 * u, 0, 4.6 * u, 4.2 * u, 0, 0, Math.PI * 2);
                ctx.ellipse(-5.6 * u, 0, 3 * u, 3.2 * u, 0, 0, Math.PI * 2);
                for(let i = -1; i <= 1; i++) ctx.ellipse(6.6 * u, i * 2.6 * u, 1.5 * u, 1.3 * u, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return;
            }
            case 'chispas':
            case 'galaxia': {
                const galaxia = (this.efecto === 'galaxia');
                const color = (galaxia && !this._paleta && !this._color) ? AvatarAura.calcularColor('galaxy', (ahora * 0.0018) + (p.s * 3)) : this.color(p, ahora, 0xFFD54F);
                const brilla = (Math.sin((ahora / 60) + (p.s * 20)) > -0.3);
                const tam = t((galaxia ? (p.s > 0.6 ? 11 : 7) : 13) * (1 - (a * 0.55)));
                const forma = (galaxia && (p.s > 0.6)) ? 'estrella' : 'destello';

                ctx.globalAlpha = desvanece * (brilla ? 1 : 0.45);
                ctx.shadowColor = hex(color);
                ctx.shadowBlur = 5 * u;
                poner(ctx, (forma === 'estrella') ? estrella(color, tam, 0, false) : destello(color, tam), x + azar, y - (galaxia ? (12 + (p.s * 66) + (a * 18)) : (12 + (a * 42) + (p.s * 24))) * u);
                ctx.shadowBlur = 0;
                return;
            }
            case 'burbujas': {
                const tam = t(9 + (p.s * 6));

                ctx.globalAlpha = 0.9 * apaga(0.6);
                poner(ctx, burbuja(this.color(p, ahora, 0x81D4FA), tam), x + azar + vaiven, y - (18 + (a * 78)) * u);
                return;
            }
            case 'humo': {
                // humo suave: aquí sí, degradado sin píxel
                const r = (5 + (a * 9)) * u;
                const gx = x + (azar / 2), gy = y - ((6 + (a * 30)) * u);
                const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
                const c = this.color(p, ahora, 0x9E9E9E);

                g.addColorStop(0, rgba(c, 0.55));
                g.addColorStop(1, rgba(c, 0));
                ctx.globalAlpha = desvanece;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(gx, gy, r, 0, Math.PI * 2);
                ctx.fill();
                return;
            }
            case 'petalos':
            case 'hojas':
            case 'nieve': {
                // caen girando desde la altura de las rodillas hasta el suelo, con vaivén
                const caida = (54 - (Math.min(1, a * 1.4) * 54)) * u;
                const ang = giro(2.5);
                let dibujo: HTMLCanvasElement;

                if(this.efecto === 'nieve') dibujo = copo(this.color(p, ahora, 0xFFFFFF), t(9), ang);
                else if(this.efecto === 'hojas') dibujo = hoja(this.color(p, ahora, HOJAS[Math.floor(p.s * HOJAS.length)]), t(10), ang);
                else dibujo = petalo(this.color(p, ahora, 0xF8BBD0), t(9), ang);

                ctx.globalAlpha = apaga(0.75);
                poner(ctx, dibujo, x + azar + vaiven, y - caida - (4 * u));
                return;
            }
            case 'corazones': {
                const late = 1 + (Math.max(0, Math.sin((ahora / 110) + (p.s * 6))) * 0.18);

                ctx.globalAlpha = apaga(0.5);
                poner(ctx, corazon(this.color(p, ahora, 0xFF4D6D), t(11 * late)), x + (azar / 2) + vaiven, y - (18 + (a * 66)) * u);
                return;
            }
            case 'estrellas': {
                ctx.globalAlpha = apaga(0.5);
                poner(ctx, estrella(this.color(p, ahora, 0xFFE066), t(12), giro(0.6), true), x + (azar / 2) + vaiven, y - (18 + (a * 66)) * u);
                return;
            }
            case 'notas':
                ctx.globalAlpha = apaga(0.5);
                poner(ctx, nota(this.color(p, ahora, 0x7E57C2), t(12), (p.n % 2) === 0), x + (azar / 2) + vaiven, y - (18 + (a * 66)) * u);
                return;
            case 'fuego':
            case 'fatuo':
            case 'fenix': {
                // una llama que tiembla en el sitio, se encoge y sube un poco; alguna suelta una brasa
                const fenix = (this.efecto === 'fenix'), fatuo = (this.efecto === 'fatuo');

                if(fenix && ((p.n % 3) === 0))
                {
                    ctx.globalAlpha = desvanece;
                    ctx.shadowColor = '#FFB300';
                    ctx.shadowBlur = 5 * u;
                    poner(ctx, pluma(t(13), giro(0.3) * 0.25 - 0.4), x + azar + (vaiven * 2), y - (24 + (a * 90)) * u);
                    ctx.shadowBlur = 0;
                    return;
                }

                const tonos: [ number, number, number ] = fatuo ? [ 0x00A152, 0x76FF03, 0xE6FFB0 ] : fenix ? [ 0xC2185B, 0xFF6F00, 0xFFE57F ]
                    : this._paleta ? [ this.color(p, ahora, 0), this.color(p, ahora + 300, 0), 0xFFFFFF ]
                        : this._color ? [ oscurecer(this._color, 0.75), this._color, 0xFFFFFF ] : [ 0xE53935, 0xFF9800, 0xFFF59D ];
                const alto = t(26 * (1 - (a * 0.65)));
                const inclina = Math.round(Math.sin((ahora / 70) + (p.s * 10)) * 2) / 2;

                ctx.globalAlpha = apaga(0.6);
                if(fenix || fatuo)
                {
                    ctx.shadowColor = fatuo ? '#76FF03' : '#FF6F00'; ctx.shadowBlur = 6 * u;
                }
                poner(ctx, llama(tonos, Math.max(3, Math.round(alto * 0.66)), alto, inclina), x + (azar / 3), y - (a * 18 * u));
                ctx.shadowBlur = 0;

                if(p.s > 0.6)
                {
                    ctx.globalAlpha = desvanece;
                    ctx.fillStyle = hex(fatuo ? 0xB2FF59 : fenix ? 0xFFE57F : 0xFFD54F);
                    ctx.fillRect(Math.round(x + azar + vaiven), Math.round(y - (30 + (a * 78)) * u), Math.max(1, Math.round(2 * u)), Math.max(1, Math.round(2 * u)));
                }
                return;
            }
            case 'hielo':
                ctx.globalAlpha = 0.95 * apaga(0.5);
                poner(ctx, cristal(this.color(p, ahora, 0x9BE7FF), t(7 + (p.s * 4)), t(13 + (p.s * 6))), x + azar, y - (2 * u));
                return;
            case 'rayos': {
                // un relámpago en zigzag con núcleo blanco y halo del color
                const color = this.color(p, ahora, 0x80D8FF);
                const encendido = (Math.sin((ahora / 25) + (p.s * 10)) > 0);
                const bx = x + azar, by = y - ((14 + (p.s * 40)) * u);

                ctx.globalAlpha = encendido ? desvanece : (desvanece * 0.25);
                ctx.shadowColor = hex(color);
                ctx.shadowBlur = 6 * u;
                ctx.lineJoin = 'miter';
                for(const [ ancho, tono ] of [ [ 3, color ], [ 1, 0xFFFFFF ] ] as [ number, number ][])
                {
                    ctx.strokeStyle = hex(tono);
                    ctx.lineWidth = Math.max(1, ancho * u);
                    ctx.beginPath();
                    ctx.moveTo(bx - (4 * u), by - (16 * u));
                    ctx.lineTo(bx + (3 * u), by - (6 * u));
                    ctx.lineTo(bx - (2 * u), by - (4 * u));
                    ctx.lineTo(bx + (5 * u), by + (8 * u));
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
                return;
            }
            case 'arcoiris': {
                // una cinta de seis franjas de través a la marcha, flotando a la altura de los tobillos
                ctx.globalAlpha = 0.95 * apaga(0.5);
                let px = -((p.mx + p.my) / 2), py = (p.mx - p.my);
                const largo = Math.hypot(px, py) || 1;
                const franja = Math.max(1, Math.round(2 * u));

                px /= largo; py /= largo;
                if(py > 0)
                {
                    px = -px; py = -py;
                }

                for(let i = 0; i < 6; i++)
                {
                    ctx.fillStyle = hex(this._paleta ? this.color(p, ahora + (i * 120), 0) : ARCOIRIS[i]);
                    ctx.fillRect(Math.round(x + (px * (2.5 - i) * franja) - franja), Math.round(y - (12 * u) + (py * (2.5 - i) * franja)), franja + 1, franja + 1);
                }

                if(p.s > 0.93)
                {
                    ctx.globalAlpha = desvanece;
                    poner(ctx, destello(0xFFFFFF, t(7)), x + azar, y - (24 + (a * 30)) * u);
                }
                return;
            }
            case 'portal': {
                // un anillo en el suelo que se abre
                const color = this.color(p, ahora, 0xB388FF);

                ctx.globalAlpha = 0.9 * desvanece;
                ctx.shadowColor = hex(color);
                ctx.shadowBlur = 5 * u;
                ctx.strokeStyle = hex(color);
                ctx.lineWidth = Math.max(1, 2 * u);
                ctx.beginPath();
                ctx.ellipse(x, y - u, Math.max(1, (8 + (a * 34)) * u), Math.max(1, (4 + (a * 17)) * u), 0, 0, (Math.PI * 2));
                ctx.stroke();
                ctx.shadowBlur = 0;
                return;
            }
            case 'monedas': {
                // saltan de los pies, giran de canto y caen rebotando
                const v = Math.min(1, a * 1.25);
                const alto = Math.abs(Math.sin(v * Math.PI * 1.5)) * (1 - (v * 0.6)) * 54 * u;
                const fase = Math.floor(((ahora / 70) + (p.s * 8)) % 6);

                ctx.globalAlpha = apaga(0.8);
                poner(ctx, moneda(t(11), fase), x + (azar * v), y - alto - (2 * u));
                return;
            }
            case 'caramelos': {
                const v = Math.min(1, a * 1.25);
                const alto = Math.abs(Math.sin(v * Math.PI * 1.5)) * (1 - (v * 0.6)) * 48 * u;

                ctx.globalAlpha = apaga(0.8);
                poner(ctx, caramelo(CARAMELOS[p.n % CARAMELOS.length], t(15), giro(1.2)), x + (azar * v), y - alto - (2 * u));
                return;
            }
            case 'mariposas': {
                // salen volando hacia arriba aleteando
                const color = this._paleta ? this.color(p, ahora, 0) : (this._color ?? DISCO[p.n % DISCO.length]);
                const abiertas = (Math.sin((ahora / 55) + (p.s * 9)) > 0);

                ctx.globalAlpha = apaga(0.7);
                poner(ctx, mariposa(color, t(15), abiertas), x + azar + (Math.sin((a * 9) + (p.s * 6)) * 18 * u), y - (18 + (a * 120)) * u);
                return;
            }
            case 'murcielagos': {
                const abiertas = (Math.sin((ahora / 45) + (p.s * 9)) > 0);

                ctx.globalAlpha = apaga(0.7);
                poner(ctx, murcielago(this._color ?? 0x2A1B3D, t(17), abiertas), x + (azar * (1 + a)) + (Math.sin((a * 7) + (p.s * 6)) * 12 * u), y - (24 + (a * 84)) * u);
                return;
            }
            case 'fantasmas':
                ctx.globalAlpha = 0.8 * ((a < 0.15) ? (a / 0.15) : apaga(0.6));
                poner(ctx, fantasma(this._color ?? 0xF5F5F5, t(13)), x + azar + (Math.sin((ahora / 200) + (p.s * 6)) * 12 * u), y - (12 + (a * 78)) * u);
                return;
            case 'calabazas': {
                // caen al suelo con un botecito y se quedan con la cara encendida
                const v = Math.min(1, a * 2.2);
                const bote = Math.abs(Math.sin(v * Math.PI * 1.5)) * (1 - v) * 24 * u;
                const luz = (Math.sin((ahora / 90) + (p.s * 12)) > -0.4);

                ctx.globalAlpha = apaga(0.75);
                ctx.shadowColor = '#FF6F00';
                ctx.shadowBlur = 4 * u;
                poner(ctx, calabaza(t(16), luz), x + (azar / 2), y - bote - (2 * u));
                ctx.shadowBlur = 0;
                return;
            }
            case 'codigo': {
                // cifras verdes que caen hasta el suelo (recién salidas, casi blancas)
                const color = this._paleta ? this.color(p, ahora, 0) : (this._color ?? ((a < 0.2) ? 0xB9F6CA : (a < 0.6) ? 0x00E676 : 0x1B8A3A));

                ctx.globalAlpha = apaga(0.75);
                ctx.shadowColor = '#00E676';
                ctx.shadowBlur = 5 * u;
                ctx.fillStyle = hex(color);
                ctx.font = `bold ${ Math.max(7, Math.round(13 * u)) }px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(String((p.n + Math.floor(ahora / 150)) % 2), Math.round(x + azar), Math.round(y - ((78 * (1 - Math.min(1, a * 1.6))) * u) - (2 * u)));
                ctx.shadowBlur = 0;
                return;
            }
            case 'baldosas': {
                // la baldosa entera se enciende y se apaga, como una pista de baile
                const color = this._paleta ? this.color(p, ahora, 0) : (this._color ?? DISCO[p.n % DISCO.length]);
                const ancho = 32 * u, alto = 16 * u;
                const rombo = (f: number) =>
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y - (alto * f));
                    ctx.lineTo(x + (ancho * f), y);
                    ctx.lineTo(x, y + (alto * f));
                    ctx.lineTo(x - (ancho * f), y);
                    ctx.closePath();
                };

                ctx.globalAlpha = 0.55 * desvanece;
                ctx.fillStyle = hex(color);
                rombo(1);
                ctx.fill();
                ctx.globalAlpha = 0.5 * desvanece;
                ctx.fillStyle = hex(aclarar(color, 0.5));
                rombo(0.55);
                ctx.fill();
                ctx.globalAlpha = desvanece;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                rombo(1);
                ctx.stroke();
                return;
            }
        }
    }
}

const ARCOIRIS = [ 0xE53935, 0xFB8C00, 0xFDD835, 0x43A047, 0x1E88E5, 0x8E24AA ];
const DISCO = [ 0xFF4081, 0x40C4FF, 0xFFEA00, 0x69F0AE, 0xE040FB, 0xFF6E40 ];
const CARAMELOS = [ 0xFF4081, 0xFFEB3B, 0x7C4DFF, 0x00E5FF, 0xFF6E40 ];

const hex = (c: number) => ('#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6));
const rgba = (c: number, a: number) => `rgba(${ (c >> 16) & 255 },${ (c >> 8) & 255 },${ c & 255 },${ a })`;
const mezclar = (c: number, hacia: number, f: number) =>
{
    const canal = (s: number) => Math.round((((c >> s) & 255) * (1 - f)) + (((hacia >> s) & 255) * f));

    return ((canal(16) << 16) | (canal(8) << 8) | canal(0));
};
const aclarar = (c: number, f: number) => mezclar(c, 0xFFFFFF, f);
const oscurecer = (c: number, f: number) => mezclar(c, 0x000000, (1 - f));

/** el dibujo con la base en (x, y) y centrado en x, en píxeles enteros */
const poner = (ctx: CanvasRenderingContext2D, dibujo: HTMLCanvasElement, x: number, y: number) =>
{
    ctx.drawImage(dibujo, Math.round(x - (dibujo.width / 2)), Math.round(y - dibujo.height));
};

// ---------------------------------------------------------------------------------------------------------------
// Sprites. Cada uno se pinta en vector a su tamaño de verdad y sprite() lo pasa a pixel art: bordes duros (sin
// medio píxeles), sombreado de tres tonos con la luz arriba a la izquierda y un contorno de 1 px del propio color
// oscurecido, como los furnis y efectos de Habbo. Se guardan hechos: un color animado se redondea para que la caché
// no crezca sin fin.

const CACHE = new Map<string, HTMLCanvasElement>();

interface Acabado { contorno?: boolean; sombra?: boolean; brillo?: boolean }

const sprite = (clave: string, ancho: number, alto: number, pintor: (c: CanvasRenderingContext2D) => void, acabado: Acabado = {}): HTMLCanvasElement =>
{
    const { contorno = true, sombra = true, brillo = false } = acabado;
    const llave = `${ clave }|${ ancho }x${ alto }|${ +contorno }${ +sombra }${ +brillo }`;
    const hecho = CACHE.get(llave);

    if(hecho) return hecho;

    if(CACHE.size > 900) CACHE.clear();

    const m = contorno ? 1 : 0;
    const lienzo = document.createElement('canvas');

    lienzo.width = ancho + (m * 2);
    lienzo.height = alto + (m * 2);

    const ctx = lienzo.getContext('2d');

    ctx.translate(m, m);
    pintor(ctx);

    const W = lienzo.width, H = lienzo.height;
    const imagen = ctx.getImageData(0, 0, W, H);
    const d = imagen.data;

    // bordes duros
    for(let i = 3; i < d.length; i += 4) d[i] = (d[i] >= 100) ? 255 : 0;

    // tres tonos: claro arriba a la izquierda, oscuro abajo a la derecha
    if(sombra)
    {
        for(let y = 0; y < H; y++)
        {
            for(let x = 0; x < W; x++)
            {
                const i = ((y * W) + x) * 4;

                if(!d[i + 3]) continue;

                const luz = (((x - (W / 2)) / W) + ((y - (H / 2)) / H));
                const f = (luz < -0.3) ? 1.22 : (luz > 0.28) ? 0.8 : 1;

                for(let c = 0; c < 3; c++) d[i + c] = Math.min(255, d[i + c] * f);
            }
        }
    }

    // contorno: cada hueco pegado al dibujo toma el color de su vecino, oscurecido
    if(contorno)
    {
        const antes = new Uint8ClampedArray(d);

        for(let y = 0; y < H; y++)
        {
            for(let x = 0; x < W; x++)
            {
                const i = ((y * W) + x) * 4;

                if(antes[i + 3]) continue;

                for(const [ vx, vy ] of [ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ], [ -1, 0 ] ])
                {
                    const nx = (x + vx), ny = (y + vy);

                    if((nx < 0) || (ny < 0) || (nx >= W) || (ny >= H)) continue;

                    const j = ((ny * W) + nx) * 4;

                    if(!antes[j + 3]) continue;

                    d[i] = antes[j] * 0.42;
                    d[i + 1] = antes[j + 1] * 0.42;
                    d[i + 2] = antes[j + 2] * 0.42;
                    d[i + 3] = 255;
                    break;
                }
            }
        }
    }

    // un píxel de brillo blanco arriba a la izquierda
    if(brillo)
    {
        for(let s = 0; s < (W + H); s++)
        {
            let hecha = false;

            for(let x = 0; x <= s; x++)
            {
                const y = (s - x);

                if((x >= W) || (y >= H)) continue;

                const i = ((y * W) + x) * 4;

                if(antes3(d, i, W, x, y))
                {
                    d[i] = d[i + 1] = d[i + 2] = 255;
                    hecha = true;
                    break;
                }
            }

            if(hecha) break;
        }
    }

    ctx.putImageData(imagen, 0, 0);
    CACHE.set(llave, lienzo);

    return lienzo;
};

// para el brillo: un píxel del relleno (no del contorno) con relleno también a su derecha y debajo
const antes3 = (d: Uint8ClampedArray, i: number, W: number, x: number, y: number) =>
{
    const lleno = (k: number) => (d[k + 3] && ((d[k] + d[k + 1] + d[k + 2]) > 120));

    return (lleno(i) && lleno(i + ((W + 1) * 4)) && lleno(i + 8));
};

const clave = (c: number) => (c & 0xF0F0F0).toString(16);

const estrella = (color: number, tam: number, ang: number, acabado: boolean) => sprite(`estrella${ clave(color) }${ ang.toFixed(2) }`, tam, tam, c =>
{
    c.fillStyle = hex(color);
    c.beginPath();
    for(let i = 0; i < 10; i++)
    {
        const r = (i % 2) ? (tam * 0.21) : (tam / 2);
        const t = ang + ((i * Math.PI) / 5) - (Math.PI / 2);

        c.lineTo((tam / 2) + (Math.cos(t) * r), (tam / 2) + (Math.sin(t) * r));
    }
    c.fill();
}, { contorno: acabado, sombra: acabado, brillo: acabado });

const destello = (color: number, tam: number) => sprite(`destello${ clave(color) }`, tam, tam, c =>
{
    const m = (tam / 2);

    c.fillStyle = hex(color);
    c.beginPath();
    c.moveTo(m, 0);
    c.quadraticCurveTo(m, m, tam, m);
    c.quadraticCurveTo(m, m, m, tam);
    c.quadraticCurveTo(m, m, 0, m);
    c.quadraticCurveTo(m, m, m, 0);
    c.fill();
    c.fillStyle = '#FFFFFF';
    c.fillRect(Math.floor(m) - 1, Math.floor(m) - 1, 2, 2);
}, { contorno: false, sombra: false });

const burbuja = (color: number, tam: number) => sprite(`burbuja${ clave(color) }`, tam, tam, c =>
{
    const r = (tam / 2);

    c.fillStyle = rgba(color, 0.45);
    c.beginPath();
    c.arc(r, r, r - 0.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = hex(color);
    c.lineWidth = 1.4;
    c.stroke();
    c.fillStyle = '#FFFFFF';
    c.fillRect(Math.round(r * 0.5), Math.round(r * 0.5), Math.max(1, Math.round(tam / 6)), Math.max(1, Math.round(tam / 6)));
}, { contorno: false, sombra: false });

const petalo = (color: number, tam: number, ang: number) => sprite(`petalo${ clave(color) }${ ang.toFixed(2) }`, tam, tam, c =>
{
    c.translate(tam / 2, tam / 2);
    c.rotate(ang);
    c.fillStyle = hex(color);
    c.beginPath();
    c.moveTo(-tam * 0.45, 0);
    c.quadraticCurveTo(0, -tam * 0.42, tam * 0.45, -tam * 0.06);
    c.lineTo(tam * 0.32, 0);
    c.lineTo(tam * 0.45, tam * 0.06);
    c.quadraticCurveTo(0, tam * 0.42, -tam * 0.45, 0);
    c.fill();
}, { brillo: true });

const hoja = (color: number, tam: number, ang: number) => sprite(`hoja${ clave(color) }${ ang.toFixed(2) }`, tam, tam, c =>
{
    c.translate(tam / 2, tam / 2);
    c.rotate(ang);
    c.fillStyle = hex(color);
    c.beginPath();
    c.moveTo(-tam * 0.48, 0);
    c.quadraticCurveTo(0, -tam * 0.45, tam * 0.48, 0);
    c.quadraticCurveTo(0, tam * 0.45, -tam * 0.48, 0);
    c.fill();
    c.strokeStyle = hex(oscurecer(color, 0.6));
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-tam * 0.4, 0);
    c.lineTo(tam * 0.4, 0);
    c.stroke();
});

const copo = (color: number, tam: number, ang: number) => sprite(`copo${ clave(color) }${ ang.toFixed(2) }`, tam, tam, c =>
{
    const r = (tam / 2) - 0.5;

    c.translate(tam / 2, tam / 2);
    c.rotate(ang);
    c.strokeStyle = hex(color);
    c.lineWidth = 1.2;
    c.beginPath();
    for(let i = 0; i < 6; i++)
    {
        const t = (i * Math.PI) / 3, cx = Math.cos(t), cy = Math.sin(t);

        c.moveTo(0, 0);
        c.lineTo(cx * r, cy * r);
        c.moveTo(cx * r * 0.55, cy * r * 0.55);
        c.lineTo((cx * r * 0.55) + (Math.cos(t + 0.9) * r * 0.3), (cy * r * 0.55) + (Math.sin(t + 0.9) * r * 0.3));
    }
    c.stroke();
}, { contorno: false, sombra: false });

const corazon = (color: number, tam: number) => sprite(`corazon${ clave(color) }`, tam, tam, c =>
{
    const w = tam, h = tam;

    c.fillStyle = hex(color);
    c.beginPath();
    c.moveTo(w / 2, h * 0.96);
    c.bezierCurveTo(-w * 0.12, h * 0.5, w * 0.06, -h * 0.12, w / 2, h * 0.3);
    c.bezierCurveTo(w * 0.94, -h * 0.12, w * 1.12, h * 0.5, w / 2, h * 0.96);
    c.fill();
}, { brillo: true });

const nota = (color: number, tam: number, doble: boolean) => sprite(`nota${ clave(color) }${ +doble }`, tam, tam, c =>
{
    const cabeza = (cx: number) =>
    {
        c.beginPath();
        c.ellipse(cx, tam * 0.8, tam * 0.2, tam * 0.15, -0.4, 0, Math.PI * 2);
        c.fill();
        c.fillRect(Math.round(cx + (tam * 0.12)), tam * 0.08, Math.max(1, Math.round(tam / 10)), tam * 0.72);
    };

    c.fillStyle = hex(color);
    if(doble)
    {
        cabeza(tam * 0.22);
        cabeza(tam * 0.7);
        c.fillRect(tam * 0.34, tam * 0.08, tam * 0.5, Math.max(2, tam * 0.16));
    }
    else
    {
        cabeza(tam * 0.38);
        c.beginPath();
        c.moveTo(tam * 0.5, tam * 0.08);
        c.quadraticCurveTo(tam * 0.95, tam * 0.25, tam * 0.78, tam * 0.55);
        c.lineTo(tam * 0.5, tam * 0.3);
        c.fill();
    }
});

const llama = (tonos: [ number, number, number ], ancho: number, alto: number, inclina: number) => sprite(`llama${ tonos.map(clave).join('') }${ inclina }`, ancho, alto, c =>
{
    const gota = (f: number, tono: number) =>
    {
        const w = ancho * f, h = alto * f, x0 = (ancho - w) / 2, y0 = (alto - h);

        c.fillStyle = hex(tono);
        c.beginPath();
        c.moveTo(x0 + (w / 2) + (inclina * w * 0.25), y0);
        c.bezierCurveTo(x0 + (w * 0.95), y0 + (h * 0.45), x0 + w, y0 + (h * 0.8), x0 + (w / 2), y0 + h);
        c.bezierCurveTo(x0, y0 + (h * 0.8), x0 + (w * 0.05), y0 + (h * 0.45), x0 + (w / 2) + (inclina * w * 0.25), y0);
        c.fill();
    };

    gota(1, tonos[0]);
    gota(0.7, tonos[1]);
    gota(0.4, tonos[2]);
}, { contorno: false, sombra: false });

const pluma = (tam: number, ang: number) => sprite(`pluma${ ang.toFixed(2) }`, tam, tam, c =>
{
    c.translate(tam / 2, tam / 2);
    c.rotate(ang);
    c.fillStyle = '#FFC107';
    c.beginPath();
    c.ellipse(0, 0, tam * 0.2, tam * 0.47, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#FF6F00';
    c.fillRect(-0.5, -tam * 0.3, 1, tam * 0.75);
}, { brillo: true });

const cristal = (color: number, ancho: number, alto: number) => sprite(`cristal${ clave(color) }`, ancho, alto, c =>
{
    c.fillStyle = hex(color);
    c.beginPath();
    c.moveTo(ancho / 2, 0);
    c.lineTo(ancho, alto * 0.35);
    c.lineTo(ancho * 0.75, alto);
    c.lineTo(ancho * 0.25, alto);
    c.lineTo(0, alto * 0.35);
    c.fill();
    c.fillStyle = hex(aclarar(color, 0.6));
    c.beginPath();
    c.moveTo(ancho / 2, 1);
    c.lineTo(ancho * 0.5, alto * 0.95);
    c.lineTo(ancho * 0.22, alto * 0.38);
    c.fill();
}, { brillo: true });

const moneda = (tam: number, fase: number) => sprite(`moneda${ fase }`, tam, tam, c =>
{
    const ancho = Math.max(1.2, Math.abs(Math.cos((fase / 6) * Math.PI)) * (tam / 2));

    c.fillStyle = '#E0A800';
    c.beginPath();
    c.ellipse(tam / 2, tam / 2, ancho, tam / 2, 0, 0, Math.PI * 2);
    c.fill();

    if(ancho > 2.5)
    {
        c.fillStyle = '#FFD54F';
        c.beginPath();
        c.ellipse(tam / 2, tam / 2, ancho * 0.62, tam * 0.31, 0, 0, Math.PI * 2);
        c.fill();
    }
}, { brillo: true });

const caramelo = (color: number, tam: number, ang: number) => sprite(`caramelo${ clave(color) }${ ang.toFixed(2) }`, tam, tam, c =>
{
    c.translate(tam / 2, tam / 2);
    c.rotate(ang);
    c.fillStyle = '#FFFFFF';
    for(const s of [ -1, 1 ])
    {
        c.beginPath();
        c.moveTo(s * tam * 0.2, 0);
        c.lineTo(s * tam * 0.5, -tam * 0.22);
        c.lineTo(s * tam * 0.5, tam * 0.22);
        c.fill();
    }
    c.fillStyle = hex(color);
    c.beginPath();
    c.arc(0, 0, tam * 0.25, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#FFFFFF';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-tam * 0.1, -tam * 0.22);
    c.lineTo(tam * 0.1, tam * 0.22);
    c.stroke();
}, { brillo: true });

const mariposa = (color: number, tam: number, abiertas: boolean) => sprite(`mariposa${ clave(color) }${ +abiertas }`, tam, tam, c =>
{
    const f = abiertas ? 1 : 0.35, m = (tam / 2);

    c.fillStyle = hex(color);
    for(const s of [ -1, 1 ])
    {
        c.beginPath();
        c.ellipse(m + (s * tam * 0.26 * f), tam * 0.34, tam * 0.22 * f, tam * 0.27, s * -0.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(m + (s * tam * 0.2 * f), tam * 0.72, tam * 0.14 * f, tam * 0.17, s * 0.5, 0, Math.PI * 2);
        c.fill();
    }
    if(abiertas)
    {
        c.fillStyle = '#FFFFFF';
        for(const s of [ -1, 1 ]) c.fillRect(Math.round(m + (s * tam * 0.24)) - 1, Math.round(tam * 0.32), 2, 2);
    }
    c.fillStyle = '#3E2723';
    c.fillRect(Math.round(m) - 1, tam * 0.2, 2, tam * 0.66);
});

const murcielago = (color: number, tam: number, abiertas: boolean) => sprite(`murcielago${ clave(color) }${ +abiertas }`, tam, Math.round(tam * 0.6), c =>
{
    const m = (tam / 2), h = (tam * 0.6), sube = abiertas ? 0 : (h * 0.35);

    c.fillStyle = hex(color);
    for(const s of [ -1, 1 ])
    {
        // ala con el borde de abajo festoneado
        c.beginPath();
        c.moveTo(m, h * 0.35);
        c.lineTo(m + (s * tam * 0.5), sube);
        c.lineTo(m + (s * tam * 0.42), h * 0.62);
        c.quadraticCurveTo(m + (s * tam * 0.33), h * 0.45, m + (s * tam * 0.26), h * 0.7);
        c.quadraticCurveTo(m + (s * tam * 0.18), h * 0.5, m + (s * tam * 0.08), h * 0.75);
        c.fill();
    }
    c.beginPath();
    c.ellipse(m, h * 0.5, tam * 0.1, h * 0.36, 0, 0, Math.PI * 2);
    c.fill();
    // orejas y ojos rojos
    c.beginPath();
    c.moveTo(m - (tam * 0.09), h * 0.22);
    c.lineTo(m - (tam * 0.07), 0);
    c.lineTo(m, h * 0.18);
    c.lineTo(m + (tam * 0.07), 0);
    c.lineTo(m + (tam * 0.09), h * 0.22);
    c.fill();
    c.fillStyle = '#FF1744';
    c.fillRect(Math.round(m) - 2, Math.round(h * 0.34), 1, 1);
    c.fillRect(Math.round(m) + 1, Math.round(h * 0.34), 1, 1);
}, { contorno: true, sombra: false });

const fantasma = (color: number, tam: number) => sprite(`fantasma${ clave(color) }`, tam, Math.round(tam * 1.2), c =>
{
    const w = tam, h = (tam * 1.2), r = (w / 2);

    c.fillStyle = hex(color);
    c.beginPath();
    c.arc(r, r, r - 0.5, Math.PI, 0);
    c.lineTo(w - 0.5, h);
    for(let i = 3; i >= 0; i--) c.quadraticCurveTo(((i + 0.5) / 4) * w, h - (h * 0.18), (i / 4) * w + 0.5, h);
    c.fill();
    c.fillStyle = '#263238';
    c.beginPath();
    c.ellipse(r - (w * 0.18), r * 0.95, w * 0.08, w * 0.12, 0, 0, Math.PI * 2);
    c.ellipse(r + (w * 0.18), r * 0.95, w * 0.08, w * 0.12, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(r, r * 1.45, w * 0.07, w * 0.08, 0, 0, Math.PI * 2);
    c.fill();
});

const calabaza = (tam: number, luz: boolean) => sprite(`calabaza${ +luz }`, tam, Math.round(tam * 0.9), c =>
{
    const w = tam, h = (tam * 0.9), m = (w / 2), cy = h * 0.58;
    const cara = luz ? '#FFEB3B' : '#FFA000';

    c.fillStyle = '#F57C00';
    for(const [ dx, rx ] of [ [ -0.22, 0.28 ], [ 0.22, 0.28 ], [ 0, 0.3 ] ])
    {
        c.beginPath();
        c.ellipse(m + (dx * w), cy, rx * w, h * 0.4, 0, 0, Math.PI * 2);
        c.fill();
    }
    c.fillStyle = '#558B2F';
    c.fillRect(Math.round(m) - 1, 0, 2, Math.max(2, Math.round(h * 0.2)));
    c.fillStyle = cara;
    for(const s of [ -1, 1 ])
    {
        c.beginPath();
        c.moveTo(m + (s * w * 0.08), cy - (h * 0.05));
        c.lineTo(m + (s * w * 0.28), cy - (h * 0.05));
        c.lineTo(m + (s * w * 0.18), cy - (h * 0.24));
        c.fill();
    }
    c.beginPath();
    c.moveTo(m - (w * 0.28), cy + (h * 0.08));
    for(let i = 0; i <= 4; i++) c.lineTo(m - (w * 0.28) + ((i / 4) * w * 0.56), cy + (h * ((i % 2) ? 0.14 : 0.08)));
    c.lineTo(m + (w * 0.2), cy + (h * 0.24));
    c.lineTo(m - (w * 0.2), cy + (h * 0.24));
    c.fill();
});

/** el lienzo recortado a lo que tiene dibujado (alfa > 30); 1x1 si está vacío */
const recortar = (c: HTMLCanvasElement): HTMLCanvasElement =>
{
    const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;

    for(let y = 0; y < c.height; y++)
    {
        for(let x = 0; x < c.width; x++)
        {
            if(data[(((y * c.width) + x) * 4) + 3] <= 30) continue;

            if(x < x0) x0 = x;
            if(x > x1) x1 = x;
            if(y < y0) y0 = y;
            if(y > y1) y1 = y;
        }
    }

    const r = document.createElement('canvas');

    if(x1 < 0) { r.width = r.height = 1; return r; }

    r.width = (x1 - x0) + 1;
    r.height = (y1 - y0) + 1;
    r.getContext('2d').drawImage(c, x0, y0, r.width, r.height, 0, 0, r.width, r.height);

    return r;
};

/** un filo oscuro y suave alrededor de lo dibujado: la casilla es clara y lo blanco (huellas, nieve) no se veía */
const contornear = (c: HTMLCanvasElement): void =>
{
    const ctx = c.getContext('2d');
    const imagen = ctx.getImageData(0, 0, c.width, c.height);
    const d = imagen.data, antes = new Uint8ClampedArray(d);
    const W = c.width, H = c.height;

    for(let y = 0; y < H; y++)
    {
        for(let x = 0; x < W; x++)
        {
            const i = ((y * W) + x) * 4;

            if(antes[i + 3] > 60) continue;

            let junto = false;

            for(const [ vx, vy ] of [ [ 0, 1 ], [ 0, -1 ], [ 1, 0 ], [ -1, 0 ] ])
            {
                const nx = (x + vx), ny = (y + vy);

                if((nx >= 0) && (ny >= 0) && (nx < W) && (ny < H) && (antes[(((ny * W) + nx) * 4) + 3] > 60)) { junto = true; break; }
            }

            if(!junto) continue;

            d[i] = d[i + 1] = d[i + 2] = 40;
            d[i + 3] = 110;
        }
    }

    ctx.putImageData(imagen, 0, 0);
};
