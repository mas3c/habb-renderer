import { TextureSource } from 'pixi.js';
import { GetTicker } from './GetTicker';
import { PixiApplicationProxy } from './PixiApplicationProxy';

// Las hojas de sprites se suben a la GPU poco a poco (8 ms por fotograma) en vez de todas en el primer fotograma
// que las pinta, y tras subirlas se suelta la copia decodificada en RAM (un ImageBitmap por hoja: la mitad de la
// memoria de imágenes). Sin copia Pixi ya no puede volver a subirla, así que su GC no las toca: las libera
// RoomContentLoader.purge al destruirlas, y una pérdida de contexto WebGL recarga el cliente entero.
// Los mapas de clic (ExtendedSprite) se leen de la GPU, no de la copia.
const PRESUPUESTO_MS = 8;
const cola: TextureSource[] = [];
let enTicker = false;

const subir = (source: TextureSource) =>
{
    const bitmap = source.resource;

    if(source.destroyed || (typeof ImageBitmap === 'undefined') || !(bitmap instanceof ImageBitmap)) return;

    const renderer = PixiApplicationProxy.instance?.renderer;

    if(!renderer?.texture) return;

    renderer.texture.initSource(source);

    source.autoGarbageCollect = false;
    source.resource = null;
    bitmap.close();
};

const procesar = () =>
{
    const inicio = performance.now();

    while(cola.length && ((performance.now() - inicio) < PRESUPUESTO_MS)) subir(cola.shift());
};

export const QueueTextureUpload = (source: TextureSource) =>
{
    if(!source) return;

    cola.push(source);

    if(enTicker) return;

    const ticker = GetTicker();

    if(!ticker) return;

    ticker.add(procesar);
    enTicker = true;
};
