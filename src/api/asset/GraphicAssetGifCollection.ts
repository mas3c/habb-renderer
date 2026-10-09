import { Texture } from 'pixi.js';

export class GraphicAssetGifCollection
{
    constructor(
        public name: string,
        public textures: Texture[],
        public durations: number[]
    )
    {}
}
