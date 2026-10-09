import { Sprite as SpriteBase, SpriteOptions, Texture } from 'pixi.js';

export class NitroSprite extends SpriteBase
{
    // Pixi 8 no acepta null ni nada (Pixi 6 lo trataba como textura vacía), y Nitro hace new NitroSprite(null)
    constructor(texture: Texture | SpriteOptions = null)
    {
        super(texture ?? Texture.EMPTY);
    }
}
