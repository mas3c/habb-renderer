import { Container, ExtractSystem, Matrix, Rectangle, RenderTexture, Renderer, Sprite, Texture } from 'pixi.js';
import { PixiApplicationProxy } from './PixiApplicationProxy';

export class PlaneTextureCache
{
    private static DEFAULT_PLANE_ID = 'DEFAULT';

    public RENDER_TEXTURE_POOL: Map<string, RenderTexture> = new Map();
    public RENDER_TEXTURE_CACHE: RenderTexture[] = [];

    // Planos idénticos (forma, material estático, sin máscaras) comparten su textura final, como en la beta de Hobbaz:
    // en el Recibidor, 777 planos son 376 distintos. RoomPlane cuenta las referencias y la suelta al quedarse sin ellas.
    public SHARED_PLANES: Map<string, { bitmap: RenderTexture, active: unknown, refs: number }> = new Map();

    public releaseSharedPlane(key: string): void
    {
        const shared = this.SHARED_PLANES.get(key);

        if(!shared || (--shared.refs > 0)) return;

        this.SHARED_PLANES.delete(key);

        const index = this.RENDER_TEXTURE_CACHE.indexOf(shared.bitmap);

        if(index >= 0) this.RENDER_TEXTURE_CACHE.splice(index, 1);

        shared.bitmap?.destroy(true);
    }

    public clearCache(): void
    {
        this.RENDER_TEXTURE_POOL.forEach(renderTexture => renderTexture?.destroy(true));

        // Las de los planos (paredes y suelo) no van al pool: sin esto cada sala visitada dejaba
        // sus texturas en la GPU para siempre. Destruir dos veces la misma no hace nada.
        for(const renderTexture of this.RENDER_TEXTURE_CACHE) renderTexture?.destroy(true);

        this.RENDER_TEXTURE_POOL.clear();
        this.RENDER_TEXTURE_CACHE = [];
        this.SHARED_PLANES.clear();
    }

    public clearRenderTexture(renderTexture: RenderTexture): RenderTexture
    {
        if(!renderTexture) return null;

        return this.writeToRenderTexture(new Sprite(Texture.EMPTY), renderTexture);
    }

    private getTextureIdentifier(width: number, height: number, planeId: string): string
    {
        return `${ planeId ?? PlaneTextureCache.DEFAULT_PLANE_ID }:${ width }:${ height }`;
    }

    public createRenderTexture(width: number, height: number, planeId: string = null): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        if(!planeId)
        {
            const renderTexture = RenderTexture.create({
                width,
                height
            });

            this.RENDER_TEXTURE_CACHE.push(renderTexture);

            return renderTexture;
        }

        planeId = this.getTextureIdentifier(width, height, planeId);

        let renderTexture = this.RENDER_TEXTURE_POOL.get(planeId);

        if(!renderTexture)
        {
            renderTexture = RenderTexture.create({
                width,
                height
            });

            this.RENDER_TEXTURE_CACHE.push(renderTexture);

            this.RENDER_TEXTURE_POOL.set(planeId, renderTexture);
        }

        return renderTexture;
    }

    public createAndFillRenderTexture(width: number, height: number, planeId = null, color: number = 16777215): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        const renderTexture = this.createRenderTexture(width, height, planeId);

        return this.clearAndFillRenderTexture(renderTexture, color);
    }

    public createAndWriteRenderTexture(width: number, height: number, displayObject: Container, planeId: string = null, transform: Matrix = null): RenderTexture
    {
        if((width < 0) || (height < 0)) return null;

        const renderTexture = this.createRenderTexture(width, height, planeId);

        return this.writeToRenderTexture(displayObject, renderTexture, true, transform);
    }

    public clearAndFillRenderTexture(renderTexture: RenderTexture, color: number = 16777215): RenderTexture
    {
        if(!renderTexture) return null;

        const sprite = new Sprite(Texture.WHITE);

        sprite.tint = color;

        sprite.width = renderTexture.width;
        sprite.height = renderTexture.height;

        return this.writeToRenderTexture(sprite, renderTexture);
    }

    public writeToRenderTexture(displayObject: Container, renderTexture: RenderTexture, clear: boolean = true, transform: Matrix = null): RenderTexture
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

    public getPixels(displayObject: Container | RenderTexture, frame: Rectangle = null): Uint8Array
    {
        const pixels = this.getExtractor().pixels(displayObject).pixels;

        return new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length);
    }

    public getRenderer(): Renderer
    {
        return PixiApplicationProxy.instance.renderer;
    }

    public getExtractor(): ExtractSystem
    {
        return this.getRenderer().extract;
    }
}
