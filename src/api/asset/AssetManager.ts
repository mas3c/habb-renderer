import { ImageSource, Spritesheet, Texture, TextureSource } from 'pixi.js';
import { NitroLogger } from '../common';
import { NitroBundle } from '../utils';
import { GraphicAssetCollection } from './GraphicAssetCollection';
import { IAssetData } from './IAssetData';
import { IAssetManager } from './IAssetManager';
import { IGraphicAsset } from './IGraphicAsset';
import { IGraphicAssetCollection } from './IGraphicAssetCollection';

export class AssetManager implements IAssetManager
{
    public static _INSTANCE: IAssetManager = new AssetManager();

    private _textures: Map<string, Texture> = new Map();
    private _collections: Map<string, IGraphicAssetCollection> = new Map();
    // nombre de asset -> colección que lo tiene. getAsset recorría TODAS las colecciones en cada
    // consulta (cada pieza de cada avatar al pintarlo) y se volvía más lento cuanta más ropa se veía.
    private _assetIndex: Map<string, IGraphicAssetCollection> = new Map();

    public getTexture(name: string): Texture
    {
        if(!name) return null;

        const existing = this._textures.get(name);

        if(!existing) return null;

        return existing;
    }

    public setTexture(name: string, texture: Texture): void
    {
        if(!name || !texture) return;

        this._textures.set(name, texture);
    }

    public getAsset(name: string): IGraphicAsset
    {
        if(!name) return null;

        const indexed = this._assetIndex.get(name);

        if(indexed)
        {
            const asset = indexed.getAsset(name);

            if(asset) return asset;

            this._assetIndex.delete(name);
        }

        for(const collection of this._collections.values())
        {
            if(!collection) continue;

            const existing = collection.getAsset(name);

            if(!existing) continue;

            this._assetIndex.set(name, collection);

            return existing;
        }

        return null;
    }

    public getCollection(name: string): IGraphicAssetCollection
    {
        if(!name) return null;

        const existing = this._collections.get(name);

        if(!existing) return null;

        return existing;
    }

    public createCollection(data: IAssetData, spritesheet: Spritesheet): IGraphicAssetCollection
    {
        if(!data) return null;

        const collection = new GraphicAssetCollection(data, spritesheet);

        if(collection)
        {
            for(const [name, texture] of collection.textures.entries()) this.setTexture(name, texture);

            this._collections.set(collection.name, collection);
        }

        return collection;
    }

    /** Libera una colección (memoria y GPU). Solo destruye las texturas de su propia imagen. */
    public removeCollection(name: string): boolean
    {
        const collection = this._collections.get(name);

        if(!collection) return false;

        this._collections.delete(name);

        for(const [ assetName, owner ] of this._assetIndex) if(owner === collection) this._assetIndex.delete(assetName);

        const baseTexture = collection.baseTexture;

        for(const [ textureName, texture ] of collection.textures)
        {
            if(this._textures.get(textureName) === texture) this._textures.delete(textureName);
        }

        collection.dispose();

        if(baseTexture)
        {
            for(const texture of collection.textures.values())
            {
                if(texture && (texture.source === baseTexture)) texture.destroy(false);
            }

            baseTexture.destroy();
        }

        return true;
    }

    public async downloadAsset(url: string): Promise<boolean>
    {
        return await this.downloadAssets([url]);
    }

    public async downloadAssets(urls: string[]): Promise<boolean>
    {
        if(!urls || !urls.length) return Promise.resolve(true);

        try
        {
            for(const url of urls)
            {
                const response = await fetch(url);

                if(response.status !== 200) continue;

                let contentType = 'application/octet-stream';

                if(response.headers.has('Content-Type'))
                {
                    contentType = response.headers.get('Content-Type');
                }

                switch(contentType)
                {
                    case 'application/octet-stream': {
                        const buffer = await response.arrayBuffer();
                        const nitroBundle = await NitroBundle.from(buffer);

                        await this.processAsset(
                            nitroBundle.baseTexture,
                            nitroBundle.jsonFile as IAssetData
                        );
                        break;
                    }
                    case 'image/png':
                    case 'image/jpeg':
                    case 'image/gif': {
                        const buffer = await response.arrayBuffer();
                        // ya decodificada: en Pixi 8 la textura nace válida, sin esperar a ningún evento
                        const baseTexture = new ImageSource({ resource: await NitroBundle.decodeImage(new Uint8Array(buffer)) });

                        this.setTexture(url, new Texture({ source: baseTexture }));
                        break;
                    }
                }
            }

            return Promise.resolve(true);
        }
        catch (err)
        {
            NitroLogger.error(err);

            return Promise.resolve(false);
        }
    }

    private async processAsset(baseTexture: TextureSource, data: IAssetData): Promise<void>
    {
        const spritesheetData = data.spritesheet;

        if(!baseTexture || !spritesheetData || !Object.keys(spritesheetData).length)
        {
            this.createCollection(data, null);

            return;
        }

        const spritesheet = new Spritesheet(baseTexture, spritesheetData);

        await spritesheet.parse();

        this.createCollection(data, spritesheet);
    }

    public get collections(): Map<string, IGraphicAssetCollection>
    {
        return this._collections;
    }
}
