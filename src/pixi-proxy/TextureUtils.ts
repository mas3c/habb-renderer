import { Container, ExtractSystem, Matrix, Rectangle, RenderTexture, Renderer, SCALE_MODE, Sprite, Texture, TextureSource } from 'pixi.js';
import { PixiApplicationProxy } from './PixiApplicationProxy';

export class TextureUtils
{
    public static generateTexture(displayObject: Container, region: Rectangle = null, scaleMode: SCALE_MODE = null, resolution: number = 1): RenderTexture
    {
        if(!displayObject) return null;

        return this.getRenderer().generateTexture({
            target: displayObject,
            frame: region ?? undefined,
            resolution,
            textureSourceOptions: { scaleMode: scaleMode ?? TextureSource.defaultOptions.scaleMode }
        }) as RenderTexture;
    }

    // Pixi 8 quitó Texture.clone(): misma fuente, recortes copiados
    public static cloneTexture(texture: Texture): Texture
    {
        if(!texture) return null;

        return new Texture({
            source: texture.source,
            frame: texture.frame.clone(),
            orig: texture.orig.clone(),
            trim: texture.trim ? texture.trim.clone() : undefined,
            rotate: texture.rotate
        });
    }

    public static generateTextureFromImage(image: HTMLImageElement): Texture
    {
        if(!image) return null;

        return Texture.from(image);
    }

    // En Pixi 8 extract.image() y base64() devuelven promesas; canvas() sigue siendo síncrono. Se sacan del canvas
    // para que todo el cliente siga llamándolas igual que con Pixi 6.
    public static generateImage(target: Container | Texture): HTMLImageElement
    {
        const url = this.generateImageUrl(target);

        if(!url) return null;

        const image = new Image();

        image.src = url;

        return image;
    }

    public static generateImageUrl(target: Container | Texture): string
    {
        const canvas = this.generateCanvas(target);

        return canvas ? canvas.toDataURL('image/png') : null;
    }

    public static generateCanvas(target: Container | Texture): HTMLCanvasElement
    {
        if(!target) return null;

        return this.getExtractor().canvas(target) as HTMLCanvasElement;
    }

    public static clearRenderTexture(renderTexture: RenderTexture): RenderTexture
    {
        if(!renderTexture) return null;

        return this.writeToRenderTexture(new Sprite(Texture.EMPTY), renderTexture);
    }

    public static createRenderTexture(width: number, height: number): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        return RenderTexture.create({
            width,
            height
        });
    }

    public static createAndFillRenderTexture(width: number, height: number, color: number = 16777215): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        const renderTexture = this.createRenderTexture(width, height);

        return this.clearAndFillRenderTexture(renderTexture, color);
    }

    public static createAndWriteRenderTexture(width: number, height: number, displayObject: Container, transform: Matrix = null): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        const renderTexture = this.createRenderTexture(width, height);

        return this.writeToRenderTexture(displayObject, renderTexture, true, transform);
    }

    public static clearAndFillRenderTexture(renderTexture: RenderTexture, color: number = 16777215): RenderTexture
    {
        if(!renderTexture) return null;

        const sprite = new Sprite(Texture.WHITE);

        sprite.tint = color;

        sprite.width = renderTexture.width;
        sprite.height = renderTexture.height;

        return this.writeToRenderTexture(sprite, renderTexture);
    }

    public static writeToRenderTexture(displayObject: Container, renderTexture: RenderTexture, clear: boolean = true, transform: Matrix = null): RenderTexture
    {
        if(!displayObject || !renderTexture) return null;

        this.getRenderer().render({
            container: displayObject,
            target: renderTexture,
            clear,
            transform: transform ?? undefined
        });

        return renderTexture;
    }

    public static getPixels(displayObject: Container | Texture, frame: Rectangle = null): Uint8Array
    {
        const pixels = this.getExtractor().pixels(frame ? { target: displayObject, frame } : displayObject).pixels;

        return new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length);
    }

    public static getRenderer(): Renderer
    {
        return PixiApplicationProxy.instance.renderer;
    }

    public static getExtractor(): ExtractSystem
    {
        return this.getRenderer().extract;
    }
}
