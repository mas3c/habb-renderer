import { Texture } from 'pixi.js';

export interface IGraphicAssetGifCollection
{
    name: string;
    textures: Texture[];
    durations: number[];
}
