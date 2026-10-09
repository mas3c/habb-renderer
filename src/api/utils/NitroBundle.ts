import { ImageSource, TextureSource } from 'pixi.js';
import { QueueTextureUpload } from '../../pixi-proxy/TextureUploadQueue';
import { Data, inflate } from 'pako';
import { BinaryReader } from './BinaryReader';

export class NitroBundle
{
    private static TEXT_DECODER: TextDecoder = new TextDecoder('utf-8');

    private _jsonFile: Object = null;
    private _baseTexture: TextureSource = null;

    // Asíncrono para no congelar la sala al cargar furnis: descompresión nativa del navegador
    // (pako, en el hilo principal, de reserva) y la imagen se decodifica fuera del hilo con
    // img.decode() desde un Blob, sin pasar por una cadena base64 del tamaño del PNG.
    public static async from(arrayBuffer: ArrayBuffer): Promise<NitroBundle>
    {
        const bundle = new NitroBundle();
        const binaryReader = new BinaryReader(arrayBuffer);

        let fileCount = binaryReader.readShort();

        while(fileCount > 0)
        {
            const fileNameLength = binaryReader.readShort();
            const fileName = binaryReader.readBytes(fileNameLength).toString();
            const fileLength = binaryReader.readInt();
            const buffer = binaryReader.readBytes(fileLength);
            const decompressed = await NitroBundle.inflate(buffer.toArrayBuffer());

            if(fileName.endsWith('.json'))
            {
                bundle._jsonFile = JSON.parse(NitroBundle.TEXT_DECODER.decode(decompressed));
            }
            else
            {
                bundle._baseTexture = await NitroBundle.createImageSource(decompressed);
            }

            fileCount--;
        }

        return bundle;
    }

    private static async inflate(data: ArrayBuffer): Promise<Uint8Array>
    {
        // El TypeScript del renderer no conoce DecompressionStream (Chrome 80, Safari 16.4, Firefox 113).
        const Decompression = (globalThis as any).DecompressionStream;

        if(Decompression)
        {
            try
            {
                const stream = new Blob([ data ]).stream().pipeThrough(new Decompression('deflate'));

                return new Uint8Array(await new Response(stream).arrayBuffer());
            }
            catch {}
        }

        return inflate((data as Data));
    }

    // hoja decodificada fuera del hilo principal, subida a la GPU por la cola y sin copia en RAM después
    public static async createImageSource(data: Uint8Array): Promise<ImageSource>
    {
        const source = new ImageSource({ resource: await NitroBundle.decodeImage(data) });

        QueueTextureUpload(source);

        return source;
    }

    public static async decodeImage(data: Uint8Array): Promise<ImageBitmap | HTMLImageElement>
    {
        const blob = new Blob([ data ], { type: 'image/png' });

        // como el cargador de Pixi 8: ImageBitmap con sus opciones por defecto y alphaMode premultiply-alpha-on-upload
        if(typeof createImageBitmap === 'function')
        {
            try
            {
                return await createImageBitmap(blob);
            }
            catch {}
        }

        const url = URL.createObjectURL(blob);
        const image = new Image();

        image.src = url;

        try
        {
            await image.decode();
        }
        catch
        {
            if(!image.complete) await new Promise(resolve => image.onload = image.onerror = resolve);
        }

        URL.revokeObjectURL(url);

        return image;
    }

    get jsonFile(): Object
    {
        return this._jsonFile;
    }

    public get baseTexture(): TextureSource
    {
        return this._baseTexture;
    }
}
