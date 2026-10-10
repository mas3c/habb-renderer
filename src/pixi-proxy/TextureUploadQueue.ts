import { TextureSource } from 'pixi.js';
import { Dispositivo } from '../api/utils/Dispositivo';
import { AlphaTolerance } from '../api/room/object/enum/AlphaTolerance';
import { Metricas } from '../api/utils/Metricas';
import { GetTicker } from './GetTicker';
import { PixiApplicationProxy } from './PixiApplicationProxy';

// Las hojas de sprites se suben a la GPU poco a poco (32 ms por fotograma en PC, 8 en móvil) en vez de todas en el primer
// fotograma que las pinta, y tras subirlas se suelta la copia decodificada en RAM (un ImageBitmap por hoja: la mitad de la
// memoria de imágenes). Sin copia Pixi ya no puede volver a subirla, así que su GC no las toca: las libera
// RoomContentLoader.purge al destruirlas, y una pérdida de contexto WebGL recarga el cliente entero.
// El mapa de clic (qué píxeles responden al ratón, ver ExtendedSprite) se saca de esa misma copia en un worker antes de
// soltarla; si no hay worker, ExtendedSprite lo lee de la GPU la primera vez que hace falta.
const PRESUPUESTO_MS = (Dispositivo.esMovil ? 8 : 32);
const MAX_PENDIENTES = (Dispositivo.esMovil ? 8 : 24);
const cola: TextureSource[] = [];
const esperando: (() => void)[] = [];
let enTicker = false;

const CODIGO_WORKER = `
self.onmessage = e => {
    const { id, bitmap, umbral } = e.data;
    try {
        const w = bitmap.width, h = bitmap.height;
        const ctx = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const px = ctx.getImageData(0, 0, w, h).data;
        const mapa = new Uint32Array(Math.ceil(w * h / 32));
        for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] >= umbral) mapa[i >> 5] |= (1 << (i & 31));
        self.postMessage({ id, mapa }, [ mapa.buffer ]);
    } catch (err) { self.postMessage({ id, mapa: null }); }
};`;

let worker: Worker = null;
let workerRoto = (typeof OffscreenCanvas === 'undefined') || (typeof Worker === 'undefined');
let siguienteId = 1;
const pendientes = new Map<number, TextureSource>();

const getWorker = () =>
{
    if(worker || workerRoto) return worker;

    try
    {
        worker = new Worker(URL.createObjectURL(new Blob([ CODIGO_WORKER ], { type: 'application/javascript' })));

        worker.onmessage = (e: MessageEvent<{ id: number, mapa: Uint32Array }>) =>
        {
            const source = pendientes.get(e.data.id) as TextureSource & { hitMap?: Uint32Array, hitMapPending?: boolean };

            pendientes.delete(e.data.id);

            if(!source) return;

            source.hitMapPending = false;

            if(e.data.mapa && !source.destroyed) source.hitMap = e.data.mapa;
        };

        worker.onerror = () =>
        {
            workerRoto = true;

            for(const source of pendientes.values()) (source as TextureSource & { hitMapPending?: boolean }).hitMapPending = false;

            pendientes.clear();
        };
    }
    catch
    {
        workerRoto = true;
        worker = null;
    }

    return worker;
};

const subir = (source: TextureSource) =>
{
    const bitmap = source.resource;

    if(source.destroyed || (typeof ImageBitmap === 'undefined') || !(bitmap instanceof ImageBitmap)) return;

    const renderer = PixiApplicationProxy.instance?.renderer;

    if(!renderer?.texture) return;

    const inicio = performance.now();

    renderer.texture.initSource(source);

    Metricas.add('subida_hojas_ms', (performance.now() - inicio));
    Metricas.add('hojas_subidas');

    source.autoGarbageCollect = false;
    source.resource = null;

    const w = getWorker();

    if(!w) return bitmap.close();

    const id = siguienteId++;

    (source as TextureSource & { hitMapPending?: boolean }).hitMapPending = true;
    pendientes.set(id, source);

    // la copia pasa al worker (se transfiere, no se duplica) y él la cierra
    w.postMessage({ id, bitmap, umbral: AlphaTolerance.MATCH_OPAQUE_PIXELS }, [ bitmap ]);
};

const procesar = (presupuesto: number = PRESUPUESTO_MS) =>
{
    const inicio = performance.now();

    while(cola.length && ((performance.now() - inicio) < presupuesto)) subir(cola.shift());

    while(esperando.length && (cola.length < MAX_PENDIENTES)) esperando.shift()();
};

export const QueueTextureUpload = (source: TextureSource) =>
{
    if(!source) return;

    cola.push(source);

    // con la pestaña oculta el ticker no corre: se sube todo de una vez para no frenar la carga
    setTimeout(() => document.hidden && procesar(Number.MAX_SAFE_INTEGER), 250);

    if(enTicker) return;

    const ticker = GetTicker();

    if(!ticker) return;

    ticker.add(() => procesar());
    enTicker = true;
};

// Freno: si la GPU no da abasto, la siguiente hoja espera a que la cola baje (no se acumulan decenas de copias en RAM)
export const WaitTextureUploadRoom = () => ((cola.length < MAX_PENDIENTES) || !enTicker) ? Promise.resolve() : new Promise<void>(resolve => esperando.push(resolve));
