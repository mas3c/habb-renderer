
import { Spritesheet, Texture } from 'pixi.js';
import { IAssetData } from './IAssetData';
import { IGraphicAsset } from './IGraphicAsset';
import { IGraphicAssetCollection } from './IGraphicAssetCollection';

export interface IAssetManager
{
    getTexture(name: string): Texture;
    setTexture(name: string, texture: Texture): void;
    getAsset(name: string): IGraphicAsset;
    getCollection(name: string): IGraphicAssetCollection;
    createCollection(data: IAssetData, spritesheet: Spritesheet): IGraphicAssetCollection;
    removeCollection(name: string): boolean;
    downloadAssets(urls: string[]): Promise<boolean>;
    downloadAsset(url: string): Promise<boolean>;
    collections: Map<string, IGraphicAssetCollection>;
}
