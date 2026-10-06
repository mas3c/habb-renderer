import { Resource, Texture } from '@pixi/core';
import { NitroConfiguration } from '../../../../../../api';

/**
 * Los Habbicons del AIR (habbicons.json del hotel + su hoja de sprites y las animaciones), listos
 * para la burbuja del avatar. Como HabbiconAssetManager/HabbiconBubble del AIR: el icono con un
 * contorno blanco de 2 px y una sombra suave debajo, a tamaño grande o a la mitad (sala alejada),
 * y en espejo si el avatar mira hacia el otro lado.
 */
export interface HabbiconDefinicion
{
    id: number;
    nombre: string;
    x: number;
    y: number;
    dir: number;
    fotogramas?: number;
    bucle?: boolean;
    portada?: number;
    pasos?: [ number, number ][];
    marcos?: [ number, number, number, number ][];
}

const CONTORNO = 2, SOMBRA = 5;

export class HabbiconAssets
{
    private static _cargando = false;
    private static _definiciones = new Map<number, HabbiconDefinicion>();
    private static _hoja: HTMLImageElement = null;
    private static _animaciones = new Map<number, HTMLImageElement>();
    private static _texturas = new Map<string, Texture<Resource>>();
    private static _tamano = 42;

    private static raiz(): string
    {
        return NitroConfiguration.getValue<string>('habbicons.url', 'habbicons/');
    }

    private static imagen(url: string, alCargar: (img: HTMLImageElement) => void): void
    {
        const img = new Image();

        img.crossOrigin = 'anonymous';
        img.onload = () => alCargar(img);
        img.src = url;
    }

    /** Empieza a cargar (una vez); mientras tanto `textura` devuelve null. */
    public static cargar(): void
    {
        if(HabbiconAssets._cargando) return;

        HabbiconAssets._cargando = true;

        const raiz = HabbiconAssets.raiz();

        fetch(raiz + 'habbicons.json').then(r => r.json()).then(datos =>
        {
            HabbiconAssets._tamano = datos.tamano ?? 42;

            for(const d of datos.iconos as HabbiconDefinicion[])
            {
                HabbiconAssets._definiciones.set(d.id, d);

                if(d.marcos?.length) HabbiconAssets.imagen(`${ raiz }animation/${ d.id }.png`, img => HabbiconAssets._animaciones.set(d.id, img));
            }
        }).catch(() => { HabbiconAssets._cargando = false; });

        HabbiconAssets.imagen(raiz + 'habbicons_spritesheet.png', img => { HabbiconAssets._hoja = img; });
    }

    public static definicion(id: number): HabbiconDefinicion
    {
        HabbiconAssets.cargar();

        return HabbiconAssets._definiciones.get(id) ?? null;
    }

    /** Fotograma que toca a los `ms` desde que salió (el fijo si no está animado o aún no ha cargado). */
    public static fotograma(id: number, ms: number): number
    {
        const d = HabbiconAssets.definicion(id);

        if(!d?.pasos?.length || !HabbiconAssets._animaciones.has(id)) return -1;

        const total = d.pasos.reduce((n, p) => n + Math.max(1, p[1]), 0);
        let t = d.bucle ? (ms % total) : Math.min(ms, total - 1);

        for(const [ fotograma, dura ] of d.pasos)
        {
            t -= Math.max(1, dura);

            if(t < 0) return fotograma;
        }

        return d.pasos[d.pasos.length - 1][0];
    }

    /** La burbuja compuesta (contorno + sombra), o null si todavía no se ha cargado. */
    public static textura(id: number, fotograma: number, pequena: boolean, espejo: boolean): Texture<Resource>
    {
        const clave = `${ id }|${ fotograma }|${ pequena ? 1 : 0 }|${ espejo ? 1 : 0 }`;
        const hecha = HabbiconAssets._texturas.get(clave);

        if(hecha) return hecha;

        const d = HabbiconAssets.definicion(id);
        const marco = (fotograma >= 0) ? d?.marcos?.[fotograma] : null;
        const origen = marco ? HabbiconAssets._animaciones.get(id) : HabbiconAssets._hoja;

        if(!d || !origen) return null;

        const [ sx, sy, sw, sh ] = marco ?? [ d.x, d.y, HabbiconAssets._tamano, HabbiconAssets._tamano ];
        const escala = pequena ? 0.5 : 1;
        const w = Math.round(sw * escala), h = Math.round(sh * escala);
        const margen = CONTORNO + SOMBRA;

        // el icono solo, a su tamaño (y en espejo si toca)
        const icono = document.createElement('canvas');
        icono.width = w;
        icono.height = h;
        const ic = icono.getContext('2d');
        ic.imageSmoothingEnabled = false;
        if(espejo) { ic.translate(w, 0); ic.scale(-1, 1); }
        ic.drawImage(origen, sx, sy, sw, sh, 0, 0, w, h);

        // su silueta en blanco, para el contorno
        const silueta = document.createElement('canvas');
        silueta.width = w;
        silueta.height = h;
        const sc = silueta.getContext('2d');
        sc.drawImage(icono, 0, 0);
        sc.globalCompositeOperation = 'source-in';
        sc.fillStyle = '#fff';
        sc.fillRect(0, 0, w, h);

        const contorno = document.createElement('canvas');
        contorno.width = w + (CONTORNO * 2);
        contorno.height = h + (CONTORNO * 2);
        const cc = contorno.getContext('2d');
        for(let dy = -CONTORNO; dy <= CONTORNO; dy++) for(let dx = -CONTORNO; dx <= CONTORNO; dx++) if(dx || dy) cc.drawImage(silueta, CONTORNO + dx, CONTORNO + dy);

        const final = document.createElement('canvas');
        final.width = w + (margen * 2);
        final.height = h + (margen * 2);
        const fc = final.getContext('2d');
        fc.imageSmoothingEnabled = false;
        // la sombra del AIR: negra al 55 %, desenfoque 6, desplazada 1,5 × 2
        fc.shadowColor = 'rgba(0, 0, 0, 0.55)';
        fc.shadowBlur = 6;
        fc.shadowOffsetX = 1.5;
        fc.shadowOffsetY = 2;
        fc.drawImage(contorno, SOMBRA, SOMBRA);
        fc.shadowColor = 'transparent';
        fc.drawImage(icono, margen, margen);

        const textura = Texture.from(final);

        HabbiconAssets._texturas.set(clave, textura);

        return textura;
    }
}
