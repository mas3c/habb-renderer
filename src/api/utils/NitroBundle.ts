import { BaseTexture } from '@pixi/core';
import { Data, inflate } from 'pako';
import { BinaryReader } from './BinaryReader';

export class NitroBundle
{
    private static TEXT_DECODER: TextDecoder = new TextDecoder('utf-8');

    private _jsonFile: Object = null;
    private _baseTexture: BaseTexture = null;

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
                bundle._baseTexture = new BaseTexture(await NitroBundle.decodeImage(decompressed));
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

    private static async decodeImage(data: Uint8Array): Promise<HTMLImageElement>
    {
        const url = URL.createObjectURL(new Blob([ data ], { type: 'image/png' }));
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

    public get baseTexture(): BaseTexture
    {
        return this._baseTexture;
    }
}
